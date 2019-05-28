'use strict'

module.exports = {

  getEvidenceType: (id) => {

    switch (id) {
      case '0':
        return 'CREATE';
        break;
      case '1':
        return 'ACCEPT';
        break;
      case '2':
        return 'ACTIVE';
        break;
      case '3':
        return 'TRANSFER';
        break;
      case '4':
        return 'BREACH';
        break;
      case '5':
        return 'ENFORCE';
        break;
      case '6':
        return 'CLOSE';
        break;
      case '7':
        return 'BORROWER PAYS ON TIME';
        break;
      case '8':
        return 'BORROWER PAYS LATE';
        break;
      case '9':
        return 'INSURER PAYS';
        break;
      default:
        return 'unknown';
    }
  }
}
