import { handler } from "../netlify/functions/start.mjs";
import { toVercel } from "./_adapt.mjs";
export default toVercel(handler);
