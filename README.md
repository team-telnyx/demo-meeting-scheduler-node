# Meeting Scheduler

⏱ **15 minutes build time || [Github Repo](https://github.com/team-telnyx/demo-meeting-scheduler-node)**


## Configuration

Create a `config.json` file in your project directory. First, use [this](https://developers.telnyx.com/docs/v2/messaging/quickstarts/portal-setup) guide to provision an SMS number and messaging profile, and create an API key. Then add those to the config file, along with your country code.

```json
{
    "API_KEY": "YOUR_API_KEY",
    "COUNTRY_CODE": "+1",
    "FROM_NUMBER": "YOUR_TELNYX_NUMBER" 
}
```

> **Note:** This file contains a secret key, it should not be committed to source control.

## Server Initialization

First, import the config file and initialize the Telnyx library.

```javascript
const config = require('./config.json');
const telnyx = Telnyx(config.API_KEY);
```

Then create an express app that watches the templates directory with `Nunjucks`, a simple templating language, and parses form data.

```javascript
const app = express();
app.use(express.urlencoded());
app.set('views', `${__dirname}/templates`);

expressNunjucks(app, {
    watch: true,
    noCache: true,
});
```

## Collect User Input

Create a simple HTML form, `index.html`, which collects the meeting date, time, customer name, and phone number. The full HTML source can be found in our GitHub repo, and we'll serve it at the root.

```javascript
app.get('/', (req, res) => {
    res.render('index');
});
```

## Implement the SMS Notification

Create a function that sends an SMS message parameterized on the destination number and text.

```javascript
function sendReminder(to, message) {
    telnyx.messages.create({
        to: `${config.COUNTRY_CODE}${to}`,
        from: config.FROM_NUMBER,
        text: message 
    });
}
```

## Parse User Input and Schedule the Message

Within the POST handler, parse the meeting time and compute how far into the future it is. We're using the `moment` Javascript library for this. Note that moment will use the current timezone for both datetime instances.

```javascript
app.post('/', (req, res) => {
    const meetingDatetime = moment(
        `${req.body.meeting_date} ${req.body.meeting_time}`,
        'YYYY-MM-DD hh:mm');
    const now = moment();

    const delta = moment.duration(meetingDatetime.diff(now));
    // ...
}
```

If the meeting is sooner than 3 hours, 5 minutes from now, return an error.

```javascript
if (delta < moment.duration({hours: 3, minutes: 5})) {
    res.render('index', {message: 'Can only schedule meetings at least 3 hours, 5 minutes in the future'});
} else {
    // ...
}
```

## Remind the User

If the time is valid, compute when to send the reminder and schedule the function call. Note that we're using `setTimeout` here, but a production solution should make use of an asynchronus processing toolkit.

```javascript
const reminderDatetime = meetingDatetime.subtract(3, 'hours');
const message = `${req.body.customer_name}, you have a meeting scheduled for ${meetingDatetime}`;

setTimeout(() => {
    sendReminder(req.body.phone, message);
}, reminderDatetime.diff(now));
```

Finally, render the success template, `success.html`

```javascript
res.render('success', {
    name: req.body.customer_name,
    meetingName: req.body.meeting_name,
    meetingDT: meetingDatetime,
    phone: req.body.phone
});
```

## Start the Server

Start the Express app.

```javascript
const port = 3000;
app.listen(port, () => console.log(`App running on port ${port}`));
```

## Running the Project

Simply run `node scheduler.js` at the command line.
