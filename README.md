# Qencode Monitoring ![Deployment Workflow](https://github.com/Rise-Vision/qencode-monitoring/workflows/Deployment%20Workflow/badge.svg?branch=master&event=push) ![Code Scanning](https://github.com/Rise-Vision/qencode-monitoring/workflows/Code%20scanning%20-%20action/badge.svg)

This project is used to monitor the Qencode encoding service so that we will be alerted if there is a problem encoding files. In that case we can turn off the [master switch] to disable encoding while investigating.

[master switch]: https://docs.google.com/document/d/1zeqJ2KRJg2-nTT3wS7W24MsHDoIg2piEVTK0CrImHSM/edit

### Builds

CI/CD via [Github Actions]. See [config].

[Github Actions]: https://github.com/Rise-Vision/qencode-monitoring/actions
[config]: https://github.com/Rise-Vision/qencode-monitoring/blob/master/.github/workflows/nodejs.yml

### Execution

A Google Cloud [Function] is triggered via [Cloud Scheduler]. The function will:

 1. Retrieve an access token from Qencode
 2. Create a Qencode encoding task
 3. Upload a file to the Qencode upload server
 4. Start the encoding task, which will cause Qencode's servers to ingest the file and optimize it
 5. Trigger a second Google Cloud Function to begin monitoring for progress via Cloud Tasks

The progress [monitoring function] will:

 1. Request encoding task status from Qencode
 2. Respond with
  - HTTP 500 if the status is not "completed", which will trigger a retry via [Cloud Tasks]
  - HTTP 200 if the status is "completed", and this will include a "success" log entry

[Cloud Scheduler]: https://console.cloud.google.com/cloudscheduler?project=rvaserver2
[Function]: https://console.cloud.google.com/functions/details/us-central1/beginNewEncodingHealthCheck?project=rvaserver2
[monitoring function]: https://console.cloud.google.com/functions/details/us-central1/checkEncodingJobStatus?project=rvaserver2
[Cloud Tasks]: https://console.cloud.google.com/cloudtasks?project=rvaserver2

### Alerts

Alerts will be emitted if:

 - an extended period of time [elapses] without a "success" log entry having acceptable duration
 - a storage server [error] is logged

[error]: https://console.cloud.google.com/monitoring/alerting/policies/18370885993215929216?project=rvaserver2
[elapses]: https://console.cloud.google.com/monitoring/alerting/policies/11984336976992200786?project=rvaserver2
