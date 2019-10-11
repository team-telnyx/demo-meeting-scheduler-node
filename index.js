const config = require('./config.json');
const telnyx = require('telnyx')(config.API_KEY);
const moment = require('moment');
const express = require('express');
const expressNunjucks = require('express-nunjucks');

const app = express();
app.use(express.urlencoded());
app.set('views', `${__dirname}/templates`);

expressNunjucks(app, {
    watch: true,
    noCache: true,
});

app.get('/', (req, res) => {
    res.render('index');
});

function sendReminder(to, message) {
    telnyx.messages.create({
        to: `${config.COUNTRY_CODE}${to}`,
        from: config.FROM_NUMBER,
        text: message 
    });
}

app.post('/', (req, res) => {
    const meetingDatetime = moment(
        `${req.body.meeting_date} ${req.body.meeting_time}`,
        'YYYY-MM-DD hh:mm');
    const now = moment();

    const delta = moment.duration(meetingDatetime.diff(now));
    if (delta < moment.duration({hours: 3, minutes: 5})) {
        res.render('index', {message: 'Can only schedule meetings at least 3 hours, 5 minutes in the future'});
    } else {
        const reminderDatetime = meetingDatetime.subtract(3, 'hours');
        const message = `${req.body.customer_name}, you have a meeting scheduled for ${meetingDatetime}`;

        setTimeout(() => {
            sendReminder(req.body.phone, message);
        }, reminderDatetime.diff(now));

        res.render('success', {
            name: req.body.customer_name,
            meetingName: req.body.meeting_name,
            meetingDT: meetingDatetime,
            phone: req.body.phone
        });
    }
}); 

const port = 3000;
app.listen(port, () => console.log(`App running on port ${port}`));