getGithubCommitApi
=============================
Small api for takes github commit

INSTALLATION
=============================
For install package:
```
npm i --production
```
also install [redis](https://redis.io/download) with standarr settings(port 6379);

USE
=============================
Api get two methods:
1. POST/start
  Parameters:
    * owner - repo owner login(mandatory)
    * repo - repo name(mandatory)
    * date - day the commit was taken(mandatory)
    * author - commit author
  Rerturn request id or error;
2. Step 2
  Parameters:
    * request_id - id, which return POST/start
  return json with commits or error;

