import { Target } from "./Target";

export function getCommonBasePath(targets: Target[]): string {
  if (targets.length === 0) {
    return "";
  }

  const pathA = targets[0].canonicalPath;
  let finalCommonPathLength = pathA.length;

  for (let t = 0; t < targets.length; t++) {
    let pathB = targets[t].canonicalPath;

    const lastSlashIndex = pathB.lastIndexOf("/");
    pathB = pathB.substring(0, lastSlashIndex);

    let commonPathLength = 0;

    for (let i = 0; i < Math.min(pathA.length, pathB.length); i++) {
      if (pathA[i] !== pathB[i]) {
        break;
      }
      commonPathLength = i;
    }

    finalCommonPathLength = Math.min(commonPathLength, finalCommonPathLength);
  }

  return pathA.substring(0, finalCommonPathLength + 1);
}
