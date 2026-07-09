import { handler } from "../netlify/functions/verify.mjs";
import { toVercel } from "./_adapt.mjs";
export default toVercel(handler);
