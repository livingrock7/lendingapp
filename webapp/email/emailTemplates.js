exports.templateList = ["LoanRequestWithoutCollateral", "LoanRequestWithCollateral", "LoanRequestTerminated", "ApprovedLoanWithoutFunds", "ApprovedLoanWithFunds", "LoanReadyForRepayment", "LoanRepaidBorrower", "LoanRepaidLender", "SmartMoneyCreation", "SmartMoneyDestruction"];

exports.emailTemplates = [{
    "TemplateName": "LoanRequestWithoutCollateral",
    "SubjectPart": "Notification from smartCredit",
    "HtmlPart": "<p>Dear {{name}},</p><p>Your loan request id {{id}} was created at {{createdAt}}.<br /> Please transfer your collateral to the escrow account {{escrow}}.</p><br><p>Kind Regards,<br /> SmartCredit.io.</p>",
    "TextPart": "Dear {{name}},\r\nYour loan request id {{id}} was created at {{createdAt}}.\nPlease transfer your collateral to the escrow account {{escrow}}.\r\nKind Regards, \nSmartCredit.io."
  },
  {
    "TemplateName": "LoanRequestWithCollateral",
    "SubjectPart": "Notification from smartCredit",
    "HtmlPart": "<p>Dear {{name}},</p><p>Collateral for the loan request id {{id}} arrived at {{updatedAt}}." +
      "Your loan request is valid till {{validTill}}.</p><br /><p>In the case your loan request is not approved your collateral " +
      "will be transfered back at {{validTill}} to your account {{ethAddress}}.</p><br><p>Kind Regards,<br /> SmartCredit.io.</p>",
    "TextPart": "Dear {{name}},\r\nCollateral for the loan request id {{id}} arrived at {{updatedAt}}." +
      "Your loan request is valid till {{validTill}}.\nIn the case your loan request is not approved your collateral " +
      "will be transfered back at {{validTill}} to your account {{ethAddress}}.\r\nKind Regards,\nSmartCredit.io.",
  },
  {
    "TemplateName": "LoanRequestTerminated",
    "SubjectPart": "Notification from smartCredit",
    "HtmlPart": "<p>Dear {{name}},</p><p>Your loan request id {{id}} was cancelled as no collateral arrived in 7 days.</p><br><p>Kind Regards,<br /> SmartCredit.io.</p>",
    "TextPart": "Dear {{name}},\r\nYour loan request id {{id}} was cancelled as no collateral arrived in 7 days.\r\nKind Regards, \nSmartCredit.io."
  },
  {
    "TemplateName": "ApprovedLoanWithoutFunds",
    "SubjectPart": "Notification from smartCredit",
    "HtmlPart": "<p>Dear {{name}},</p><p>You approved loan request id {{id}} at {{createdAt}}.<br /> Please transfer funds {{amount}} ETH to the escrow account {{escrow}}.</p><br><p>Kind Regards,<br /> SmartCredit.io.</p>",
    "TextPart": "<p>Dear {{name}},\r\nYou approved loan request id {{id}} at {{createdAt}}.\nPlease transfer funds {{amount}} ETH to the escrow account {{escrow}}.\r\nKind Regards, \nSmartCredit.io."
  },
  {
    "TemplateName": "ApprovedLoanWithFunds",
    "SubjectPart": "Notification from smartCredit",
    "HtmlPart": "<p>Dear {{name}},</p><p>Your funds for the loan request id {{id}} arrived at {{updatedAt}}.<br /> Loan {{loanId}} was created. Your loan is valid till {{validTill}}.</p><br><p>Kind Regards,<br /> SmartCredit.io.</p>",
    "TextPart": "<p>Dear {{name}},\r\nYour funds for the loan request id {{id}} arrived at {{updatedAt}}.\nLoan {{loanId}} was created. Your loan is valid till {{validTill}}.\r\nKind Regards, \nSmartCredit.io."
  },
  {
    "TemplateName": "LoanReadyForRepayment",
    "SubjectPart": "Notification from smartCredit",
    "HtmlPart": "<p>Dear {{name}},</p><p>Your loan is scheduled for repayment.<br /> Please transfer amount {{amount}} to the escrow account {{escrow}} till {{validTill}}.</p><br><p>Kind Regards,<br /> SmartCredit.io.</p>",
    "TextPart": "Dear {{name}},\r\nYour loan is scheduled for repayment.\nPlease transfer amount {{amount}} to the escrow account {{escrow}} till {{validTill}}.\r\nKind Regards,\nSmartCredit.io."
  },
  {
    "TemplateName": "LoanRepaidBorrower",
    "SubjectPart": "Notification from smartCredit",
    "HtmlPart": "<p>Dear {{name}},</p><p>Your repayment {{amount}} ETH arrived in the escrow account {{escrow}}.<br /> Your collateral will be transferred back to your account {{ethAddress}}.</p><br><p>Kind Regards,<br /> SmartCredit.io.</p>",
    "TextPart": "Dear {{name}},\r\nYour repayment {{amount}} ETH arrived in the escrow account {{escrow}}.\nYour collateral will be transferred back to your account {{ethAddress}}.\r\nKind Regards,\nSmartCredit.io."
  },
  {
    "TemplateName": "LoanRepaidLender",
    "SubjectPart": "Notification from smartCredit",
    "HtmlPart": "<p>Dear {{name}},</p><p>Loan {{loanId}} was repaid. Funds {{amount}} ETH were transfered to your account {{ethAddress}}.</p><br><p>Kind Regards,<br /> SmartCredit.io.</p>",
    "TextPart": "Dear {{name}},\r\nLoan {{loanId}} was repaid. Funds {{amount}} ETH were transfered to your account {{ethAddress}}.\r\nKind Regards,\nSmartCredit.io."
  },
  {
    "TemplateName": "SmartMoneyCreation",
    "SubjectPart": "Notification from smartCredit",
    "HtmlPart": "<p>Dear {{name}},</p><p>SmartMoney tokens in {{amount}} were credited to your account {{ethAddress}}.</p><br><p>Kind Regards,<br /> SmartCredit.io.</p>",
    "TextPart": "Dear {{name}},\r\nSmartMoney tokens in {{amount}} were credited to your account {{ethAddress}}.\r\nKind Regards,\nSmartCredit.io."
  },
  {
    "TemplateName": "SmartMoneyDestruction",
    "SubjectPart": "Notification from smartCredit",
    "HtmlPart": "<p>Dear {{name}},</p><p>SmartMoney tokens in your account {{ethAddress}} in amount {{amount}} were destroyed as borrower repaid the loan.</p><br><p>Kind Regards,<br /> SmartCredit.io.</p>",
    "TextPart": "Dear {{name}},\r\nSmartMoney tokens in your account {{ethAddress}} in amount {{amount}} were destroyed as borrower repaid the loan.\r\nKind Regards,\nSmartCredit.io."
  }
]
