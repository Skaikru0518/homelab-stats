export const BASE_PATH = process.env["NEXT_PUBLIC_BASE_PATH"] ?? "";

/** API útvonal a basePath elé fűzésével. A nyers fetch nem kapja meg magától. */
export const api = (path: string): string => `${BASE_PATH}${path}`;
