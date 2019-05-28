const AWS = require('aws-sdk');
const _ = require('lodash');
const config = require(`${__dirname}/../config/aws_config.json`);
const templates = require('./emailTemplates.js');

AWS.config.update(config);
const ITEMS_COUNT = 10;
// Create SES service object
var ses = new AWS.SES({
  apiVersion: '2010-12-01'
});


let sesTemplateList;

// Handle promise's fulfilled/rejected states
ses.listTemplates({
  MaxItems: ITEMS_COUNT
}, function(err, data) {
  if (err)
    console.error(err, err.stack);
  else {
    console.log(data);
    sesTemplateList = data.TemplatesMetadata;

    _.forEach(sesTemplateList, function(templateData) {
      if (templates.templateList.includes(templateData.Name)) {
        ses.getTemplate({
          TemplateName: templateData.Name
        }, async function(err, data) {
          if (err)
            console.error(err, err.stack);
          else {
            let templateName = data.Template.TemplateName
            let template = _.find(templates.emailTemplates, {
              "TemplateName": templateName
            });
            if (!_.isEqual(data.Template, template)) {
              updateEmailTemplate(template);
            }
          }
        });
      } else {
        deleteEmailTemplate(templateData.Name);
      }
    });

    _.forEach(templates.emailTemplates, function(templateData) {
      if (!_.find(sesTemplateList, {
          "Name": templateData.TemplateName
        })) {
        createEmailTemplate(templateData);
      }
    });
  }
});


function createEmailTemplate(template) {
  // Create createTemplate params
  var params = {
    Template: template
  };

  // Handle promise's fulfilled/rejected states
  ses.createTemplate(params, function(err, data) {
    if (err)
      console.error(err, err.stack);
    else
      console.log(data);
  });
}

function updateEmailTemplate(template) {
  // Create createTemplate params
  var params = {
    Template: template
  };

  // Handle promise's fulfilled/rejected states
  ses.updateTemplate(params, function(err, data) {
    if (err)
      console.error(err, err.stack);
    else
      console.log(data);
  });
}

function deleteEmailTemplate(templateName) {

  // Handle promise's fulfilled/rejected states
  ses.deleteTemplate({
    TemplateName: templateName
  }, function(err, data) {
    if (err)
      console.error(err, err.stack);
    else
      console.log(data);
  });
}
