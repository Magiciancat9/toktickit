import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { getPrisma } from "../prisma.js";

// GET /api/admin/users
export async function getUsers(req: Request, res: Response) {
  try {
    const { search, role } = req.query;
    
    // Build where clause
    const where: any = {};
    
    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }
    
    if (role && typeof role === "string") {
      // Validate role
      if (["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role)) {
        where.role = role;
      }
    }
    
    const users = await getPrisma().user.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        requiresPasswordChange: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json({ data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: { message: "An unexpected error occurred. Please try again later." } });
  }
}

// GET /api/admin/users/:id
export async function getUser(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: { message: "Invalid user ID" } });
    }
    
    const user = await getPrisma().user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        requiresPasswordChange: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: { message: "User not found" } });
    }
    
    res.json({ data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: { message: "An unexpected error occurred. Please try again later." } });
  }
}

// POST /api/admin/users
export async function createUser(req: Request, res: Response) {
  try {
    const { name, email, role, isActive, initialPassword } = req.body;
    
    if (!name || !email || !role || !initialPassword) {
      return res.status(400).json({ 
        error: { message: "Name, email, role, and initial password are required" } 
      });
    }
    
    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: { message: "Please enter a valid email address" } });
    }
    
    if (!["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role)) {
      return res.status(400).json({ error: { message: "Invalid role" } });
    }
    
    // Check for duplicate email
    const existingUser = await getPrisma().user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(409).json({ error: { message: "A user with this email already exists" } });
    }
    
    // Validate password rules (at least 8 chars, uppercase, lowercase, number, special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?\\|`~-]).{8,}$/;
    if (!passwordRegex.test(initialPassword)) {
      return res.status(400).json({ error: { message: "Password does not meet requirements" } });
    }
    
    const passwordHash = await bcrypt.hash(initialPassword, 10);
    
    const newUser = await getPrisma().user.create({
      data: {
        name,
        email,
        role,
        isActive: isActive !== undefined ? isActive : true,
        passwordHash,
        requiresPasswordChange: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        requiresPasswordChange: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.status(201).json({ data: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: { message: "An unexpected error occurred. Please try again later." } });
  }
}

// PATCH /api/admin/users/:id
export async function updateUser(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const { name, email, role, isActive } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: { message: "Invalid user ID" } });
    }
    
    const currentUser = await getPrisma().user.findUnique({ where: { id } });
    
    if (!currentUser) {
      return res.status(404).json({ error: { message: "User not found" } });
    }
    
    // If email is changing, check for duplicates
    if (email && email !== currentUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: { message: "Please enter a valid email address" } });
      }

      const existingUser = await getPrisma().user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(409).json({ error: { message: "This email is already in use by another user" } });
      }
    }
    
    if (role && !["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role)) {
      return res.status(400).json({ error: { message: "Invalid role" } });
    }
    
    // Check deactivation rules
    if (isActive === false) {
      // 1. Cannot deactivate self
      if ((req as any).user && (req as any).user.id === id) {
        return res.status(403).json({ error: { message: "You cannot deactivate your own account" } });
      }
      
      // 2. Cannot deactivate last active admin
      if (currentUser.role === "ADMINISTRATOR" && currentUser.isActive) {
        const activeAdminsCount = await getPrisma().user.count({
          where: { role: "ADMINISTRATOR", isActive: true }
        });
        
        if (activeAdminsCount <= 1) {
          return res.status(409).json({ error: { message: "Cannot deactivate the last active Administrator" } });
        }
      }
    }
    
    // Check role change for last admin
    if (role && role !== "ADMINISTRATOR" && currentUser.role === "ADMINISTRATOR" && currentUser.isActive) {
      const activeAdminsCount = await getPrisma().user.count({
        where: { role: "ADMINISTRATOR", isActive: true }
      });
      
      if (activeAdminsCount <= 1) {
        return res.status(409).json({ error: { message: "Cannot change role of the last active Administrator" } });
      }
    }
    
    const updatedUser = await getPrisma().user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        requiresPasswordChange: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json({ data: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: { message: "An unexpected error occurred. Please try again later." } });
  }
}

// POST /api/admin/users/:id/reset-password
export async function resetPassword(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const { newPassword } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: { message: "Invalid user ID" } });
    }
    
    if (!newPassword) {
      return res.status(400).json({ error: { message: "New password is required" } });
    }
    
    const user = await getPrisma().user.findUnique({ where: { id } });
    
    if (!user) {
      return res.status(404).json({ error: { message: "User not found" } });
    }
    
    // Validate password rules (at least 8 chars, uppercase, lowercase, number, special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?\\|`~-]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: { message: "Password does not meet requirements" } });
    }
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await getPrisma().user.update({
      where: { id },
      data: {
        passwordHash,
        requiresPasswordChange: true
      }
    });
    
    res.json({ data: { message: "Password reset successfully" } });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: { message: "An unexpected error occurred. Please try again later." } });
  }
}
