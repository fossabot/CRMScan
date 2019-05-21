using System.Web.Http;
using System.Web.Http.Cors;
using WebAPI.Utils;

namespace WebAPI
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            log4net.Config.XmlConfigurator.Configure();
            var cors = new EnableCorsAttribute("*", "*", "*");
            config.EnableCors(cors);

            // Web API routes
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{action}/{id}"
                ,defaults: new { id = RouteParameter.Optional }
            );
            config.Filters.Add(new ExceptionHandlingAttribute());
        }
    }
}
