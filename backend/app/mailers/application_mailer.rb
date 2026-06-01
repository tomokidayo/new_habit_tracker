class ApplicationMailer < ActionMailer::Base
  default from: "noreply@habit-tracker.local"
  layout "mailer"
end
