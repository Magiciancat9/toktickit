declare module 'connect-pg-simple' {
  import { RequestHandler } from 'express';
  import session from 'express-session';
  
  function connectPgSimple(session: typeof session): any;
  export = connectPgSimple;
}
