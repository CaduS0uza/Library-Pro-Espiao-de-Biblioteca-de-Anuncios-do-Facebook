import { handler } from "../netlify/functions/admin.mjs";
import { toVercel } from "./_adapt.mjs";
export default toVercel(handler);
