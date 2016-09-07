Set CATALINA_HOME=%cd%\tomcat
Set CATALINA_BASE=%cd%\tomcat
Set JAVA_HOME=%cd%\tomcat\bin\jre
call %cd%\tomcat\bin\service.bat install Tomcat6CAS
net start Tomcat6CAS