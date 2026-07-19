import { z } from "zod";

export const optionalStringArray = z.array(z.string().min(1)).default([]);
