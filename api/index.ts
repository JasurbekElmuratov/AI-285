import { handleApi } from '../backend/app.ts';
import { productionDependencies } from '../backend/runtime.ts';
const deps = productionDependencies();
export async function GET(request: Request) { return handleApi(request, deps); }
export async function POST(request: Request) { return handleApi(request, deps); }
export async function PATCH(request: Request) { return handleApi(request, deps); }
