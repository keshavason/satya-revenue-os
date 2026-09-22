// SPDX-License-Identifier: Apache-2.0
import { executeSkill } from "../runtime.js";

export const name = "competitor-research";
export function run(input) {
  return executeSkill(name, input);
}

export default run;

