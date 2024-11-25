type HttpMethod = 'GET' | 'POST';
interface ApiRoute {
    method: HttpMethod;
    path: string;
    description?: string;
}
declare const apiRoutes: {
    [key: string]: ApiRoute;
};
export default apiRoutes;
