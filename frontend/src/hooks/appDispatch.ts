import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store'; // Adjust the path

export const useAppDispatch = () => useDispatch<AppDispatch>();
