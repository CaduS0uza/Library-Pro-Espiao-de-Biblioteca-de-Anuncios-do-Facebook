import { handler } from "../netlify/functions/reset.mjs";
import { toVercel } from "./_adapt.mjs";
export default toVercel(handler);
