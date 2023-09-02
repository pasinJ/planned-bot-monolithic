import { DefaultBodyType, Path, PathParams, ResponseResolver, RestContext, RestRequest, rest } from 'msw';

import { API_BASE_URL } from '#infra/httpClient.constant';
import { Method } from '#infra/httpClient.type';

export function addRestRoute<
  RequestBodyType extends DefaultBodyType = DefaultBodyType,
  Params extends PathParams<keyof Params> = PathParams,
  ResponseBody extends DefaultBodyType = DefaultBodyType,
>(
  method: Method,
  path: Path,
  resolver: ResponseResolver<RestRequest<RequestBodyType, Params>, RestContext, ResponseBody>,
) {
  return method === 'GET'
    ? rest.get(path, resolver)
    : method === 'POST'
    ? rest.post(path, resolver)
    : method === 'PUT'
    ? rest.put(path, resolver)
    : method === 'PATCH'
    ? rest.patch(path, resolver)
    : method === 'DELETE'
    ? rest.delete(path, resolver)
    : method === 'HEAD'
    ? rest.head(path, resolver)
    : method === 'OPTIONS'
    ? rest.options(path, resolver)
    : rest.all(path, resolver);
}

export function createApiPath(url: string): string {
  return `${API_BASE_URL}${url}`;
}
