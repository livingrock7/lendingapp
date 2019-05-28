const AWS = require('aws-sdk');
const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../config/config.json`)[env];
const awsConfig = require(`${__dirname}/../config/aws_config.json`);

AWS.config.update(awsConfig);

// Create the promise and SES service object
var ses = new AWS.SES({
  apiVersion: '2010-12-01'
});

exports.sendEmail = function(to, templateName, data) {
  // Create sendTemplatedEmail params
  var params = {
    Destination: { /* required */
      // CcAddresses: [
      //   'EMAIL_ADDRESS',
      //   /* more CC email addresses */
      // ],
      ToAddresses: [
        to
        /* more To email addresses */
      ]
    },
    Source: awsConfig.sourceEmail,
    /* required */
    Template: templateName,
    /* required */
    TemplateData: JSON.stringify(data),
    /* required */
    ReplyToAddresses: [
      awsConfig.sourceEmail
    ],
  };

  if (config.email_notification) {
    // Handle promise's fulfilled/rejected states
    ses.sendTemplatedEmail(params, function(err, data) {
      if (err)
        console.error(err, err.stack);
      else
        console.log(data);
    });
  }
}
