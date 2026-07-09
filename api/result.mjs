import { handler } from "../netlify/functions/result.mjs";
import { toVercel } from "./_adapt.mjs";
export default toVercel(handler);
