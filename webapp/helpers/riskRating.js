'use strict'

module.exports = {

  calculateRisk: (data) => {
    let rating = 0;

    if (data.amazonRating)
      rating++;
    if (data.alibabaRating)
      rating++;
    if (data.airbnbRating)
      rating++;
    if (data.ebayRating)
      rating++;
    if (data.linkedin)
      rating++;
    if (data.facebook)
      rating++;
    if (data.jobCertificate)
      rating++;
    if (data.leID)
      rating++;
    if (data.upwork)
      rating++;

    return rating;
  }
}
