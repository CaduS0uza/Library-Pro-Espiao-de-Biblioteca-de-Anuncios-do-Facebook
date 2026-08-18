import { handler } from "../netlify/functions/ping.mjs";
import { toVercel } from "./_adapt.mjs";
export default toVercel(handler);
