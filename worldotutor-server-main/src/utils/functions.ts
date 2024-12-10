export function getQueryParams(query: any) {
  let q = {};
  Object.keys(query).forEach((key) => {
    // @ts-ignore
    q[key] = query[key]
  })
  return q;
}
