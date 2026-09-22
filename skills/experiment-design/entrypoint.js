// SPDX-License-Identifier: Apache-2.0
import { executeSkill } from "../runtime.js";

export const name = "experiment-design";
export function run(input) {
  return executeSkill(name, input);
}

export default run;

