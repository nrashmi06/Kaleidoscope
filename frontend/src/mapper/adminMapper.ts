const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api`;

export const AdminMapper = {
  sendMassEmail: `${BASE_URL}/admin/send-mass-email`,
};
