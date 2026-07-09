import { handler } from "../netlify/functions/signup.mjs";
import { toVercel } from "./_adapt.mjs";
export default toVercel(handler);
