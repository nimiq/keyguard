const TRANSLATIONS = {
    en: {
        _language: 'English',
        continue: 'Continue',

        'back-to': 'Back to',

        'recovery-words-title': 'Write these 24 words on a piece of paper.',
        'recovery-words-intro-text': 'The Recovery Words are the ONLY way to restore '
                                   + 'your account in case you lose your Login File or password.',
        'recovery-words-intro-offline': 'Keep your Words offline, don’t enter them anywhere but in the Nimiq Safe.',
        'recovery-words-intro-copy': 'Create a copy and store it in a safe place: family’s house, bank locker etc.',
        'recovery-words-intro-safety': 'Mind water and fire, use a sealed box to keep your Recovery Words safe.',
        'recovery-words-text': 'Anyone with these words can access your account! Keep them save.',

        'create-heading-choose-identicon': 'Choose an avatar',
        'create-heading-create-password': 'Create a password',
        'create-heading-repeat-password': 'Confirm your password',
        'create-heading-validate-backup': 'Validate your backup',
        'create-wallet-desc': 'This is your account with your first address in it.',

        'import-heading-enter-recovery-words': 'Enter Recovery Words',
        'import-upload-login-file': 'Upload your Login File',
        'import-unlock-account': 'Unlock your account',
        'import-create-account': 'Create new account',

        'import-file-button-words': 'Login with Recovery Words',

        'import-words-file-available': 'Using the Recovery Words creates a new Login File. '
                                     + 'Create a password to secure it.',
        'import-words-file-unavailable': 'Using the Recovery Words creates a new account. '
                                       + 'Create a password to secure it.',
        'import-words-hint': 'Press Tab to Jump to the next field',
        'import-words-error': 'This is not a valid account. Typo?',
        'import-words-download-loginfile': 'Download your Login File',

        'file-import-prompt': 'Drag here or click to upload',

        'sign-tx-heading-tx': 'Confirm Transaction',
        'sign-tx-heading-checkout': 'Verify Payment',
        'sign-tx-includes': 'includes',
        'sign-tx-fee': 'fee',
        'sign-tx-cancel-payment': 'Cancel payment',

        'sign-msg-heading': 'Sign Message',

        'passphrasebox-enter-passphrase': 'Enter your password',
        'passphrasebox-repeat-password': 'Repeat your password',
        'passphrasebox-continue': 'Continue',
        'passphrasebox-log-in': 'Unlock',
        'passphrasebox-log-out': 'Confirm logout',
        'passphrasebox-download': 'Download Login File',
        'passphrasebox-confirm-tx': 'Confirm transaction',
        'passphrasebox-show-words': 'Show recovery words',
        'passphrasebox-sign-msg': 'Sign message',
        'passphrasebox-password-strength-short': 'Enter at least 8 characters',
        'passphrasebox-password-strength-weak': 'That password is too weak',
        'passphrasebox-password-strength-good': 'Ok, that is an average password',
        'passphrasebox-password-strength-strong': 'Great, that is a strong password',
        'passphrasebox-password-strength-secure': 'Super, that is a secure password',
        'passphrasebox-password-skip': 'Skip for now',

        'identicon-selector-loading': 'Mixing colors',
        'identicon-selector-generate-new': 'Generate new',
        'identicon-selector-more-addresses': 'More addresses',

        'download-loginfile-download': 'Download Login File',
        'download-loginfile-tap-and-hold': 'Tap and hold image to download',
        'download-loginfile-continue': 'Continue',

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

        'export-file-heading': 'Download Login File',
        'export-file-intro-heading': 'Save your account',
        'export-file-intro-blue-text': 'Your Login File grants access to your account. '
                                     + 'Only you can access it. Download and save it.',
        'export-file-intro-orange-text': 'Never share it. Don\'t Lose it.',
        'export-words-intro-heading': 'There is no password recovery!',
        'go-to-recovery-words': 'Go to Recovery Words',
        'export-continue-to-login-file': 'Continue to Login File',

        'remove-key-heading': 'Don\'t lose access',
        'remove-key-intro-text': 'If you log out without saving your account, you will irretrievably '
                               + 'lose access to it!',
        'remove-key-login-file-question': 'Is your Login File savely stored and accessible?',
        'remove-key-download-login-file': 'Download Login File',
        'remove-key-recovery-words-question': 'Do you know where your Recovery Words are?',
        'remove-key-show-recovery-words': 'Create a backup',
        'remove-key-enter-label-1': 'Type',
        'remove-key-enter-label-2': 'to log out.',
        'remove-key-final-confirm': 'Log out',

        'derive-address-heading-password': 'Unlock your account',
        'derive-address-password-text': 'To add a new address, please[br]unlock your account first.',
        'derive-address-heading-choose-identicon': 'Choose a new address',

        'change-password-heading': 'Confirm old password',
        'change-password-paragraph': 'Changing the password will create a new Login File that replaces the '
                                   + 'current one.',
        'change-password-paragraph-legacy': 'Changing the password only has an effect on this device.',
        'change-password-info-item-1': 'All old Login Files still work with their old passwords.',
        'change-password-info-item-2': 'If a Login File was compromised: Please create a new account and transfer '
                                     + 'all funds.',
        'change-password-download-login-file': 'Download new Login File',
        'change-password-set-password-heading': 'Create a new password',
        'change-password-set-password-text': 'Secure your new Login File.',
        'change-password-set-password-text-legacy': 'Secure your account.',

        'error-no-referrer-heading': 'That went wrong :(',
        'error-no-referrer-message': 'We could not verify the origin of your request. Please go back and try again.',
    },
    de: {
        _language: 'Deutsch',
        continue: 'Weiter',

        'back-to': 'Zurück zu',

        'recovery-words-title': 'Schreibe diese 24 Wörter auf ein Papier.',
        'recovery-words-intro-text': 'Die Wiederherstellungswörter sind der EINZIGE Weg Zugriff zu '
                                   + 'deinem Account zu erlangen, falls das Login File verloren geht.',
        'recovery-words-intro-offline': 'Behalte deine Wiederherstellungswörter offline und '
                                        + 'gib sie nur im Nimiq Safe ein.',
        'recovery-words-intro-copy': 'Erstelle eine Kopie und verwahre sie an einem sicheren Ort: '
                                   + 'Dem Haus deiner Familie, Bankschließfach, etc.',
        'recovery-words-intro-safety': 'Schütze dich vor Wasser und Feuer und benutze eine verschlossene Kiste um '
                                     + 'deine Wiederherstellungswörter zu verwahren.',
        'recovery-words-text': 'Jeder im Besitz dieser Wörter kann auf deinen Account zugreifen. Verwahre sie sicher.',

        'create-heading-choose-identicon': 'Wähle deinen Konto-Avatar',
        'create-heading-create-password': 'Erstelle ein Passwort',
        'create-heading-repeat-password': 'Bestätige dein Passwort',
        'create-heading-validate-backup': 'Überprüfe dein Backup',
        'create-wallet-desc': 'Das ist dein Account mit deiner ersten Addresse.',

        'import-heading-enter-recovery-words': 'Wiederherstellungswörter eingeben',
        'import-upload-login-file': 'Lade dein Login File hoch',
        'import-unlock-account': 'Entsperre deinen Account',
        'import-create-account': 'Erstelle einen neuen Account',

        'import-file-button-words': 'Wiederherstellungswörter eingeben',

        'import-words-file-available': 'Die Wiederherstellungswörter erzeugen eine neue Login File. '
                                     + 'Setze ein Passwort um sie zu schützen.',
        'import-words-file-unavailable': 'Die Wiederherstellungswörter erzeugen einen neuen Account. '
                                       + 'Setze ein Passwort um ihn zu schützen.',
        'import-words-hint': 'Mit Tab kannst du zum nächsten Feld springen',
        'import-words-error': 'Das ist kein gültiger Account. Schreibfehler?',
        'import-words-download-loginfile': 'Lade dein Login File herunter',

        'file-import-prompt': 'Ziehe dein Login File auf dieses Feld',

        'sign-tx-heading-tx': 'Überweisung bestätigen',
        'sign-tx-heading-checkout': 'Zahlung bestätigen',
        'sign-tx-includes': 'inklusive',
        'sign-tx-fee': 'Gebühr',
        'sign-tx-cancel-payment': 'Zahlung abbrechen',

        'sign-msg-heading': 'Nachricht signieren',

        'passphrasebox-enter-passphrase': 'Gib dein Passwort ein',
        'passphrasebox-repeat-password': 'Wiederhole dein Passwort',
        'passphrasebox-continue': 'Weiter',
        'passphrasebox-log-in': 'Entsperren',
        'passphrasebox-log-out': 'Abmeldung bestätigen',
        'passphrasebox-download': 'Login File herunterladen',
        'passphrasebox-confirm-tx': 'Überweisung bestätigen',
        'passphrasebox-show-words': 'Wiederherstellungswörter anzeigen',
        'passphrasebox-sign-msg': 'Nachricht signieren',
        'passphrasebox-password-strength-short': 'Gib mindestens 8 Zeichen ein',
        'passphrasebox-password-strength-weak': 'Dieses Passwort ist zu schwach',
        'passphrasebox-password-strength-good': 'Ok, das ist ein gutes Passwort',
        'passphrasebox-password-strength-strong': 'Gut, das ist ein starkes Passwort',
        'passphrasebox-password-strength-secure': 'Super, das ist ein sicheres Passwort',
        'passphrasebox-password-skip': 'Erstmal überspringen',

        'identicon-selector-loading': 'Mische Farben',
        'identicon-selector-generate-new': 'Neu generieren',
        'identicon-selector-more-addresses': 'Mehr Adressen',

        'download-loginfile-download': 'Login File herunterladen',
        'download-loginfile-tap-and-hold': 'Zum Herunterladen Bild gedrückt halten',
        'download-loginfile-continue': 'Weiter',

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
        'validate-words-24-hint': 'Was ist das 34. Wort?',

        'export-file-heading': 'Login File herunterladen',
        'export-file-intro-heading': 'Sichere deinen Account',
        'export-file-intro-blue-text': 'Dein Login File gewährt Zugang zu deinem Account. '
                                    + 'Nur du kannst darauf zugreifen. Lade es runter und speichere es.',
        'export-file-intro-orange-text': 'Teile es mit niemandem. Verliere es nicht.',
        'export-words-intro-heading': 'Es gibt keine Passwortwiederherstellung',
        'go-to-recovery-words': 'Zu den Wiederherstellungswörtern',
        'export-continue-to-login-file': 'Weiter zum Login File',

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
        'derive-address-heading-choose-identicon': 'Wähle deinen Konto-Avatar',
        'derive-address-text-select-avatar': 'Wähle einen Avatar für deinen neuen Account aus der Auswahl unten.',

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

        'error-no-referrer-heading': 'Das ging schief :(',
        'error-no-referrer-message': 'Wir konnten nicht überprüfen, wo deine Anfrage herkommt. Bitte gehe zurück und '
                                   + 'versuche es nochmal.',
    },
};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
