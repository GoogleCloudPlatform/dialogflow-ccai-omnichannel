
## Get all users
SELECT USER_UID from `chatanalytics.chatmessages` where USER_UID IS NOT NULL
GROUP BY USER_UID

## Get everything from a user
SELECT * from `chatanalytics.chatmessages` where USER_UID = 'r9f7irzTAmMrhXt1y49o6DqyZAk2' ORDER BY DATE_TIME
ASC

## Get a session transcript
SELECT * from `chatanalytics.chatmessages` where SESSION_ID = '8e302870-68da-4052-b567-8ca5433666cd' ORDER BY DATE_TIME ASC

