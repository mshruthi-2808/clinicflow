import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_clinicflow_default',
  defaultConsultMinutes: parseInt(process.env.DEFAULT_CONSULT_MINUTES || '15', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
};
