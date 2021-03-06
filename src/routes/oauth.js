const winston = require('winston');
const WebClient = require('@slack/client').WebClient;
const Team = require('../team');
const Boom = require('boom');


module.exports = async (request, reply) => {
    if (request.query.code) {
        // Installed!
        try {
            const slackWebClient = new WebClient();
            const accessResponse = await slackWebClient.oauth.access({
                client_id: process.env.SLACK_CLIENT_ID,
                client_secret: process.env.SLACK_CLIENT_SECRET,
                code: request.query.code
            });

            const team = await Team.createOrUpdate({
                id: accessResponse.team_id,
                name: accessResponse.team_name,
                access_token: accessResponse.access_token,
                scope: accessResponse.scope,
                user_id: accessResponse.user_id
            });

            winston.info(`Added to team "${team.name}" (${team.id}) by user ${team.user_id}`);
            return 'Success';
        } catch (err) {
            winston.error(`Could not oauth, slack-side error - ${err}`);
            return 'Internal server error, please try again later';
        }
    } else if (request.query.error) {
        // Error
        // Display error
        winston.error(`Could not oauth, error from query - ${request.query.error}`);
        return request.query.error;
    } else {
        // Unknown error
        winston.error(`Could not oauth, unknown error`);
        return 'Unknown error';
    }
};
