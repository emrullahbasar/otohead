import { API_ENDPOINTS } from '../config/api';
import { handleApiResponse, NetworkError } from '../config/errors';

export const fetchBrands = async (): Promise<string[]> => {
  const response = await fetch(`${API_ENDPOINTS.cars}/brands`)
    .catch(() => { throw new NetworkError(); });

  return handleApiResponse(response);
};

export const fetchModels = async (brand: string): Promise<string[]> => {
  const response = await fetch(
    `${API_ENDPOINTS.cars}/models/${encodeURIComponent(brand)}`
  ).catch(() => { throw new NetworkError(); });

  return handleApiResponse(response);
};