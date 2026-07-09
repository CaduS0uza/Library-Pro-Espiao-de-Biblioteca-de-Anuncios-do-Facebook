import { handler } from "../netlify/functions/login.mjs";
import { toVercel } from "./_adapt.mjs";
export default toVercel(handler);
