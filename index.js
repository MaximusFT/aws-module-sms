const AWS = require('aws-sdk');

class AwsModuleSMS {
  /**
   * @param { accessKeyId: '', secretAccessKey: '', region: '' } config
   */
  constructor(config) {
    AWS.config.update(config);
    this.sns = new AWS.SNS();
    this.defaultRegion = config.region || 'eu-west-1';
    this.otherRegions = [
      'ap-northeast-1',
      'ap-southeast-1',
      'ap-southeast-2',
      'us-east-1',
      'us-west-2',
      'eu-west-1',
    ].filter(region => region !== this.defaultRegion);
    this.attempt = 0;
    this.params = {
      Message: 'Test',
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: 'Demo',
        },
      },
      MessageStructure: 'strin  g',
      PhoneNumber: '+48791023209',
    };
  }

  template(message) {
    this.params.Message = `Message: ${message}`;
  }

  async changeRegion(region) {
    return AWS.config.update({ region });
  }

  async send(number, message = null) {
    if (number) {
      this.params.PhoneNumber = number;
      if (message) {
        this.template(message);
      }
      const ret = await this.sendSMS();
      return ret;
    }
    return false;
  }

  async repeatSend() {
    this.sendSMS();
  }

  async sendSMS() {
    try {
      const ret = await this.sns.publish(this.params, async (err, data) => {
        if (err) {
          this.attempt++;
          await this.changeRegion(this.otherRegions[this.attempt - 1]);
          await this.repeatSend();
          console.log('Failed send SMS', err, data);
        } else {
          if (this.attempt) {
            this.changeRegion(this.defaultRegion);
            this.attempt = 0;
          }
          console.log('Success send SMS', err, data);
        }
      });
      return ret;
    } catch (error) {
      console.log(error, `Failed send SMS`);
      throw error;
    }
  }
}

module.exports = AwsModuleSMS;
