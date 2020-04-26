const TRANSLATIONS = {
    en: {
        _language: 'English',

        'back-to': 'Back to',

        'funding-cashlink': 'Funding cashlink',

        'recovery-words-title': 'Write these 24 words on a piece of paper.',
        'recovery-words-intro-text': 'The Recovery Words are the ONLY way to restore '
                                   + 'your Account in case you lose your Login File or password.',
        'recovery-words-intro-offline': 'Keep your words offline, enter them nowhere but on '
                                      + '[strong]keyguard[/strong].nimiq.com.',
        'recovery-words-intro-copy': 'Create a copy and store it in a safe place: family’s house, bank locker etc.',
        'recovery-words-intro-safety': 'Mind water and fire, use a sealed box to keep your Recovery Words safe.',
        'recovery-words-text': 'Anyone with these words can access your Account! Keep them safe.',
        'recovery-words-validate': 'Validate backup',

        'create-heading-choose-identicon': 'Choose an Avatar',
        'create-heading-create-password': 'Create a password',
        'create-heading-repeat-password': 'Confirm your password',
        'create-heading-validate-backup': 'Validate your backup',
        'create-wallet-desc': 'This is your Account with your first Address.',

        'import-heading-enter-recovery-words': 'Enter Recovery Words',
        'import-import-login-file': 'Import your Login File',
        'import-login-to-continue': 'Please login again to continue.',
        'import-unlock-account': 'Unlock your Account',
        'import-create-account': 'Create new Account',

        'import-file-button-words': 'Login with Recovery Words',

        'import-words-file-available': 'Using the Recovery Words creates a new Login File. '
                                     + 'Create a password to secure it.',
        'import-words-file-unavailable': 'Using the Recovery Words creates a new Account. '
                                       + 'Create a password to secure it.',
        'import-words-hint': 'Press Tab to Jump to the next field',
        'import-words-error': 'This is not a valid Account. Typo?',
        'import-words-wrong-seed-phrase': 'These Recovery Words belong to a different Account',
        'import-words-download-loginfile': 'Save your Login File',

        'file-import-prompt': 'Drag here or click to import',

        'sign-tx-heading-tx': 'Confirm Transaction',
        'sign-tx-heading-checkout': 'Verify Payment',
        'sign-tx-heading-cashlink': 'Create a Cashlink',
        'sign-tx-fee': 'fee',
        'sign-tx-cancel-payment': 'Cancel payment',

        'sign-msg-heading': 'Sign Message',

        'tab-width-selector-label': 'Tab Width',

        'address-info-new-cashlink': 'New Cashlink',

        'passwordbox-enter-password': 'Enter your password',
        'passwordbox-enter-pin': 'Enter your PIN',
        'passwordbox-repeat-password': 'Repeat your password',
        'passwordbox-repeat': 'Repeat password',
        'passwordbox-continue': 'Continue',
        'passwordbox-log-in': 'Unlock',
        'passwordbox-confirm': 'Confirm',
        'passwordbox-log-out': 'Confirm logout',
        'passwordbox-confirm-tx': 'Confirm transaction',
        'passwordbox-create-cashlink': 'Create cashlink',
        'passwordbox-confirm-create': 'Create Account',
        'passwordbox-confirm-log-in': 'Log in',
        'passwordbox-show-words': 'Show recovery words',
        'passwordbox-sign-msg': 'Sign message',
        'passwordbox-password-strength-short': 'Enter 8 characters or more',
        'passwordbox-password-strength-weak': 'Weak password',
        'passwordbox-password-strength-good': 'Good password',
        'passwordbox-password-strength-strong': 'Strong password',
        'passwordbox-password-strength-secure': 'Secure password',
        'passwordbox-repeat-password-long': 'No match, please try again',
        'passwordbox-repeat-password-short': 'Password is too short',
        'passwordbox-password-skip': 'Skip for now',
        'passwordbox-reset-password': 'Reset with Recovery Words',

        'payment-info-line-order-amount': 'Order amount',
        'payment-info-line-vendor-markup': 'Vendor crypto markup',
        'payment-info-line-vendor-discount': 'Vendor crypto discount',
        'payment-info-line-effective-rate': 'Effective rate',
        'payment-info-line-free-service': 'Nimiq provides this service free of charge.',
        'payment-info-line-total': 'Total',
        'payment-info-line-network-fee': 'network fee',
        'payment-info-line-paying-more': 'You are paying approx. %RATE_DEVIATION% more than at the current market rate '
                                       + '(coingecko.com).',
        'payment-info-line-paying-less': 'You are paying approx. %RATE_DEVIATION% less than at the current market rate '
                                       + '(coingecko.com).',
        'payment-info-line-actual-discount': 'Your actual discount is approx. %RATE_DEVIATION% compared to the current '
                                           + 'market rate (coingecko.com).',

        'timer-expiry': 'This offer expires in',
        'timer-second': 'second',
        'timer-seconds': 'seconds',
        'timer-minute': 'minute',
        'timer-minutes': 'minutes',
        'timer-hour': 'hour',
        'timer-hours': 'hours',
        'timer-day': 'day',
        'timer-days': 'days',

        'identicon-selector-generate-new': 'New Avatars',

        'download-loginfile-download': 'Download Login File',
        'download-loginfile-successful': 'Download successful?',
        'download-loginfile-tap-and-hold': 'Tap and hold image to download',
        'download-loginfile-continue': 'Continue when ready',
        'download-loginfile-download-again': 'Download again',

        'validate-words-text': 'Please select the correct word from your list of recovery words.',
        'validate-words-1-hint': 'What is the 1st word?',
        'validate-words-2-hint': 'What is the 2nd word?',
        'validate-words-3-hint': 'What is the 3rd word?',
        'validate-words-4-hint': 'What is the 4th word?',
        'validate-words-5-hint': 'What is the 5th word?',
        'validate-words-6-hint': 'What is the 6th word?',
        'validate-words-7-hint': 'What is the 7th word?',
        'validate-words-8-hint': 'What is the 8th word?',
        'validate-words-9-hint': 'What is the 9th word?',
        'validate-words-10-hint': 'What is the 10th word?',
        'validate-words-11-hint': 'What is the 11th word?',
        'validate-words-12-hint': 'What is the 12th word?',
        'validate-words-13-hint': 'What is the 13th word?',
        'validate-words-14-hint': 'What is the 14th word?',
        'validate-words-15-hint': 'What is the 15th word?',
        'validate-words-16-hint': 'What is the 16th word?',
        'validate-words-17-hint': 'What is the 17th word?',
        'validate-words-18-hint': 'What is the 18th word?',
        'validate-words-19-hint': 'What is the 19th word?',
        'validate-words-20-hint': 'What is the 20th word?',
        'validate-words-21-hint': 'What is the 21st word?',
        'validate-words-22-hint': 'What is the 22nd word?',
        'validate-words-23-hint': 'What is the 23rd word?',
        'validate-words-24-hint': 'What is the 24th word?',

        'export-file-heading': 'Access your Login File',
        'export-file-intro-heading': 'Save your Account',
        'export-file-intro-blue-text': 'Your Login File grants access to your Account. '
                                     + 'Download and save it.',
        'export-file-intro-browser': 'Your Account is stored in your browser.',
        'export-file-intro-accident': 'It might be deleted automatically or by accident.',
        'export-file-intro-download-file': 'Download the Login File to secure access to your Account.',
        'export-file-intro-orange-text': 'Keep it safe and confidential.',
        'export-file-success-set-password': 'Set password',
        'export-file-success-save-file': 'Save Login File',
        'export-file-success-create-backup': 'Create backup',
        'export-file-success-heading': 'Take 5 minutes for a backup',
        'export-file-success-words-intro': 'There is no \'forgot password\' option. '
                                         + 'Write down 24 words to create a secure backup.',
        'export-words-intro-heading': 'There is no password recovery!',
        'export-words-unlock-heading': 'Unlock your Backup',
        'export-words-hint': 'Scroll to continue',
        'go-to-recovery-words': 'Create backup',
        'export-continue-to-login-file': 'Continue to Login File',
        'export-show-recovery-words': 'Show Recovery Words',

        'remove-key-heading': 'Don\'t lose access',
        'remove-key-intro-text': 'If you log out without saving your Account, you will irreversibly lose access to it!',
        'remove-key-login-file-question': 'Is your Login File savely stored and accessible?',
        'remove-key-download-login-file': 'Download Login File',
        'remove-key-recovery-words-question': 'Do you know where your Recovery Words are?',
        'remove-key-show-recovery-words': 'Create a backup',
        'remove-key-enter-label-1': 'Type',
        'remove-key-enter-label-2': 'to log out.',
        'remove-key-final-confirm': 'Log out',

        'derive-address-heading-password': 'Unlock new Addresses',
        'derive-address-password-text': 'To add a new Address, please[br]unlock your Account first.',

        'change-password-heading': 'Confirm old password',
        'change-password-paragraph': 'Changing the password will create a new Login File that replaces the '
                                   + 'current one.',
        'change-password-paragraph-legacy': 'Changing the password only has an effect on this device.',
        'change-password-info-item-1': 'All old Login Files still work with their old passwords.',
        'change-password-info-item-2': 'If a Login File was compromised: Please create a new Account and transfer '
                                     + 'all funds.',
        'change-password-download-login-file': 'Download new Login File',
        'change-password-set-password-heading': 'Create a new password',
        'change-password-set-password-text': 'Secure your new Login File.',
        'change-password-set-password-text-legacy': 'Secure your Account.',

        'error-no-request-heading': 'That went wrong :(',
        'error-no-request-message': 'We could not detect a valid request. Please go back and try again.',
    },
    de: {
        _language: 'Deutsch',

        'back-to': 'Zurück zu',

        'funding-cashlink': 'Cashlink erstellen',

        'recovery-words-title': 'Schreibe diese 24 Wörter auf ein Papier.',
        'recovery-words-intro-text': 'Die Wiederherstellungswörter sind der EINZIGE Weg Zugriff zu '
                                   + 'deinem Account zu erlangen, falls das Login File verloren geht.',
        'recovery-words-intro-offline': 'Behalte deine Wiederherstellungswörter offline und '
                                      + 'gib sie nur auf [strong]keyguard[/strong].nimiq.com ein.',
        'recovery-words-intro-copy': 'Erstelle eine Kopie und verwahre sie an einem sicheren Ort: '
                                   + 'Dem Haus deiner Familie, Bankschließfach, etc.',
        'recovery-words-intro-safety': 'Schütze dich vor Wasser und Feuer und benutze eine verschlossene Kiste um '
                                     + 'deine Wiederherstellungswörter zu verwahren.',
        'recovery-words-text': 'Jeder im Besitz dieser Wörter kann auf deinen Account zugreifen. Verwahre sie sicher.',
        'recovery-words-validate': 'Wörter überprüfen',

        'create-heading-choose-identicon': 'Wähle deinen Konto-Avatar',
        'create-heading-create-password': 'Erstelle ein Passwort',
        'create-heading-repeat-password': 'Bestätige dein Passwort',
        'create-heading-validate-backup': 'Überprüfe dein Backup',
        'create-wallet-desc': 'Das ist dein neuer Account mit seiner ersten Addresse.',

        'import-heading-enter-recovery-words': 'Wiederherstellungswörter eingeben',
        'import-import-login-file': 'Lade dein Login File hoch',
        'import-login-to-continue': 'Bitte logge dich neu ein um fortzufahren.',
        'import-unlock-account': 'Entsperre deinen Account',
        'import-create-account': 'Erstelle einen neuen Account',

        'import-file-button-words': 'Wiederherstellungswörter eingeben',

        'import-words-file-available': 'Die Wiederherstellungswörter erzeugen eine neue Login File. '
                                     + 'Setze ein Passwort um sie zu schützen.',
        'import-words-file-unavailable': 'Die Wiederherstellungswörter erzeugen einen neuen Account. '
                                       + 'Setze ein Passwort um ihn zu schützen.',
        'import-words-hint': 'Mit Tab kannst du zum nächsten Feld springen',
        'import-words-error': 'Das ist kein gültiger Account. Schreibfehler?',
        'import-words-wrong-seed-phrase': 'Diese Wiederherstellungswörter gehören zu einem anderen Account',
        'import-words-download-loginfile': 'Lade dein Login File herunter',

        'file-import-prompt': 'Ziehe dein Login File auf dieses Feld',

        'sign-tx-heading-tx': 'Überweisung bestätigen',
        'sign-tx-heading-checkout': 'Zahlung bestätigen',
        'sign-tx-heading-cashlink': 'Cashlink erzeugen',
        'sign-tx-fee': 'Gebühr',
        'sign-tx-cancel-payment': 'Zahlung abbrechen',

        'sign-msg-heading': 'Nachricht signieren',

        'tab-width-selector-label': 'Tab-Breite',

        'address-info-new-cashlink': 'Neuer Cashlink',

        'passwordbox-enter-password': 'Gib dein Passwort ein',
        'passwordbox-enter-pin': 'Gib deine PIN ein',
        'passwordbox-repeat-password': 'Wiederhole dein Passwort',
        'passwordbox-repeat': 'Passwort wiederholen',
        'passwordbox-continue': 'Weiter',
        'passwordbox-log-in': 'Entsperren',
        'passwordbox-confirm': 'Bestätigen',
        'passwordbox-log-out': 'Abmeldung bestätigen',
        'passwordbox-confirm-tx': 'Überweisung bestätigen',
        'passwordbox-create-cashlink': 'Cashlink erstellen',
        'passwordbox-confirm-create': 'Account erstellen',
        'passwordbox-confirm-log-in': 'Account anmelden',
        'passwordbox-show-words': 'Wiederherstellungswörter anzeigen',
        'passwordbox-sign-msg': 'Nachricht signieren',
        'passwordbox-password-strength-short': 'Gib mindestens 8 Zeichen ein',
        'passwordbox-password-strength-weak': 'Dieses Passwort ist zu schwach',
        'passwordbox-password-strength-good': 'Ok, das ist ein gutes Passwort',
        'passwordbox-password-strength-strong': 'Gut, das ist ein starkes Passwort',
        'passwordbox-password-strength-secure': 'Super, das ist ein sicheres Passwort',
        'passwordbox-repeat-password-long': 'Keine Übereinstimmung, bitte versuche es erneut',
        'passwordbox-repeat-password-short': 'Das Passwort ist zu kurz',
        'passwordbox-password-skip': 'Erstmal überspringen',
        'passwordbox-reset-password': 'Mit Wiederherstellungswörtern zurücksetzen',

        'payment-info-line-order-amount': 'Kaufbetrag',
        'payment-info-line-vendor-markup': 'Verkäufer Krypto-Aufschlag',
        'payment-info-line-vendor-discount': 'Verkäufer Krypto-Rabatt',
        'payment-info-line-effective-rate': 'Effektiver Wechselkurs',
        'payment-info-line-free-service': 'Nimiq bietet diesen Service kostenfrei an.',
        'payment-info-line-total': 'Gesamt',
        'payment-info-line-network-fee': 'Netzwerkgebühr',
        'payment-info-line-paying-more': 'Du zahlst etwa %RATE_DEVIATION% mehr als zum aktuellen '
                                       + 'Wechselkurs (coingecko.com).',
        'payment-info-line-paying-less': 'Du zahlst etwa %RATE_DEVIATION% weniger als zum aktuellen '
                                       + 'Wechselkurs (coingecko.com).',
        'payment-info-line-actual-discount': 'Dein tatsächlicher Rabatt beträgt etwa %RATE_DEVIATION% zum aktuellen '
                                           + 'Wechselkurs (coingecko.com).',

        'timer-expiry': 'Angebot endet in',
        'timer-second': 'Sekunde',
        'timer-seconds': 'Sekunden',
        'timer-minute': 'Minute',
        'timer-minutes': 'Minuten',
        'timer-hour': 'Stunde',
        'timer-hours': 'Stunden',
        'timer-day': 'Tag',
        'timer-days': 'Tagen',

        'identicon-selector-generate-new': 'Neue Avatare',

        'download-loginfile-download': 'Login File herunterladen',
        'download-loginfile-successful': 'Download erfolgreich?',
        'download-loginfile-tap-and-hold': 'Zum Herunterladen Bild gedrückt halten',
        'download-loginfile-continue': 'Weiter',
        'download-loginfile-download-again': 'Erneut herunterladen',

        'validate-words-text': 'Bitte wähle das richtige Wort aus deiner Liste von Wiederherstellungswörtern aus.',
        'validate-words-1-hint': 'Was ist das 1. Wort?',
        'validate-words-2-hint': 'Was ist das 2. Wort?',
        'validate-words-3-hint': 'Was ist das 3. Wort?',
        'validate-words-4-hint': 'Was ist das 4. Wort?',
        'validate-words-5-hint': 'Was ist das 5. Wort?',
        'validate-words-6-hint': 'Was ist das 6. Wort?',
        'validate-words-7-hint': 'Was ist das 7. Wort?',
        'validate-words-8-hint': 'Was ist das 8. Wort?',
        'validate-words-9-hint': 'Was ist das 9. Wort?',
        'validate-words-10-hint': 'Was ist das 10. Wort?',
        'validate-words-11-hint': 'Was ist das 11. Wort?',
        'validate-words-12-hint': 'Was ist das 12. Wort?',
        'validate-words-13-hint': 'Was ist das 13. Wort?',
        'validate-words-14-hint': 'Was ist das 14. Wort?',
        'validate-words-15-hint': 'Was ist das 15. Wort?',
        'validate-words-16-hint': 'Was ist das 16. Wort?',
        'validate-words-17-hint': 'Was ist das 17. Wort?',
        'validate-words-18-hint': 'Was ist das 18. Wort?',
        'validate-words-19-hint': 'Was ist das 19. Wort?',
        'validate-words-20-hint': 'Was ist das 20. Wort?',
        'validate-words-21-hint': 'Was ist das 21. Wort?',
        'validate-words-22-hint': 'Was ist das 22. Wort?',
        'validate-words-23-hint': 'Was ist das 23. Wort?',
        'validate-words-24-hint': 'Was ist das 24. Wort?',

        'export-file-heading': 'Login File entsperren',
        'export-file-intro-heading': 'Sichere deinen Account',
        'export-file-intro-blue-text': 'Dein Login File gewährt Zugang zu deinem Account. '
                                     + 'Lade es runter und speichere es.',
        'export-file-intro-browser': 'Dein Account ist in deinem Browser gespeichert.',
        'export-file-intro-accident': 'Als Teil deiner Browserdatan könnten sie versehentlich gelöscht werden.',
        'export-file-intro-download-file': 'Lade zur Sicherheit ein Login File runter und um dich damit in anderen '
                                         + 'Browsern und Geräten anzumelden.',
        'export-file-intro-orange-text': 'Teile es mit niemandem. Verliere es nicht.',
        'export-file-success-set-password': 'Passwort gesetzt',
        'export-file-success-save-file': 'Login File gespeichert',
        'export-file-success-create-backup': 'Backup erstellt',
        'export-file-success-heading': 'Nimm dir 5 Minuten Zeit für ein Backup',
        'export-file-success-words-intro': 'Es gibt keine Möglichkeit der Passwortwiederherstellung. '
                                         + 'Schreib dir 24 Wörter auf um ein sicheres Backup zu erstellen.',
        'export-words-intro-heading': 'Es gibt keine Passwortwiederherstellung',
        'export-words-unlock-heading': 'Account entsperren',
        'export-words-hint': 'Runter scrollen zum fortfahren',
        'go-to-recovery-words': 'Erstelle ein Backup',
        'export-continue-to-login-file': 'Weiter zum Login File',
        'export-show-recovery-words': 'Wiederherstellungswörter anzeigen',

        'remove-key-heading': 'Verliere deinen Zugang nicht',
        'remove-key-intro-text': 'Falls du dich ausloggst, ohne dein Konto zu sichern, wirst du unwiderruflich'
                               + 'den Zugriff darauf verlieren. ',
        'remove-key-login-file-question': 'Ist dein Login File sicher gespeichert und zugänglich?',
        'remove-key-download-login-file': 'Login File herunterladen',
        'remove-key-recovery-words-question': 'Weißt du, wo sich deine Wiederherstellungswörter befinden?',
        'remove-key-show-recovery-words': 'Sicherung anlegen',
        'remove-key-enter-label-1': 'Gib',
        'remove-key-enter-label-2': 'ein, um dich auszuloggen.',
        'remove-key-final-confirm': 'Ausloggen',

        'derive-address-heading-password': 'Entschlüssele deinen Account',
        'derive-address-password-text': 'Bitte gib dein Passwort ein um deinem Account eine weitere Adresse '
                                        + 'hinzuzufügen.',

        'change-password-heading': 'Altes Passwort bestätigen',
        'change-password-paragraph': 'Die Passwortänderung wird ein neues Login File erstellen, welches das bisherige '
                                   + 'ersetzt.',
        'change-password-paragraph-legacy': 'Die Passwordänderung wird nur für dieses Gerät wirksam.',
        'change-password-info-item-1': 'Alle alten Login Files funktionieren weiterhin mit ihrem alten Passwort.',
        'change-password-info-item-2': 'Wenn ein Login File kompromittiert wurde: Erstelle einen neuen Account und '
                                     + 'übertrage alle NIM.',
        'change-password-download-login-file': 'Neues Login File herunterladen',
        'change-password-set-password-heading': 'Neues Passwort setzen',
        'change-password-set-password-text': 'Sichere dein neues Login File.',
        'change-password-set-password-text-legacy': 'Sichere deinen Account.',

        'error-no-request-heading': 'Das ging schief :(',
        'error-no-request-message': 'Wir konnten keine gültige Anfrage finden. Bitte gehe zurück und '
                                  + 'versuche es nochmal.',
    },
};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
