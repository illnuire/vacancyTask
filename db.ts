import { Pool } from 'pg';

let portInt = parseInt(process.env.DB_PORT);

export default new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,  
  port: portInt,
  database: process.env.DB_DATABASE
})