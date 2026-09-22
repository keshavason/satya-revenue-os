// SPDX-License-Identifier: Apache-2.0
import { executeSkill } from "../runtime.js";

export const name = "customer-research";
export function run(input) {
  return executeSkill(name, input);
}

export default run;

