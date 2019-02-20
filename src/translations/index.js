const TRANSLATIONS = {
    en: {
        _language: 'English',
        loading: 'Loading...',
        continue: 'Continue',

        'back-to': 'Back to',

        'passphrase-strength': 'Strength',
        'passphrase-placeholder': 'Enter password',
        'passphrase-repeat-placeholder': 'Repeat password',

        'privacy-warning-heading': 'Are you being watched?',
        'privacy-warning-text': 'Now is the perfect time to assess your surroundings. '
                              + 'Nearby windows? Hidden cameras? Shoulder spies? '
                              + 'Anyone with your backup phrase can access and spend your NIM.',
        'privacy-agent-continue': 'Continue',

        'recovery-words-title': 'Recovery Words',
        'recovery-words-input-label': 'Recovery Words',
        'recovery-words-input-field-placeholder': 'word #',
        'recovery-words-explanation': 'The following words will grant you access to your wallet even if your '
                                    + 'Wallet File is lost.',
        'recovery-words-storing': 'Write these words on a piece of paper and store them at a safe, offline place.',
        'recovery-words-continue-to-words': 'Continue to Recovery Words',

        'create-heading-choose-identicon': 'Choose an avatar',
        'create-heading-create-password': 'Create a password',
        'create-heading-repeat-password': 'Confirm your password',
        'create-heading-validate-backup': 'Validate your backup',
        'create-wallet-desc': 'This is your Account with your first Address in it.',

        'import-heading-enter-recovery-words': 'Enter Recovery Words',
        'import-link-no-wallet': 'Don\'t have a wallet yet?',
        'import-heading-protect': 'Protect your wallet',
        'import-text-set-password': 'You can now set a password to encrypt your wallet on this device.',
        'import-upload-login-file': 'Upload your Login File',
        'import-unlock-account': 'Unlock your account',
        'import-create-account': 'Create new Account',

        'import-file-button-words': 'Login with Recovery Words',

        'import-words-file-available': 'Using the Recovery Words creates a new Login File. '
                                     + 'Create a password to secure it.',
        'import-words-file-unavailable': 'Using the Recovery Words creates a new Account. '
                                       + 'Create a password to secure it.',
        'import-words-hint': 'Press Tab to Jump to the next field',
        'import-words-error': 'This is not a valid account. Typo?',
        'import-words-download-loginfile': 'Download your Login File',

        'file-import-prompt': 'Drag here or click to upload',
        'file-import-click-hint': 'Or click to select a file.',

        'enter-recovery-words-heading': 'Import from recovery words',
        'enter-recovery-words-enter-words': 'Please enter your 24 recovery words.',

        'choose-key-type-heading': 'Choose key type',
        'choose-key-type-text': 'We couldn\'t determine the type of your key. Please select it below.',
        'choose-key-type-or': 'or',
        'choose-key-type-legacy-address-heading': 'Single address',
        'choose-key-type-legacy-address-info': 'Created before xx/xx/2018',
        'choose-key-type-bip39-address-heading': 'Multiple addresses',
        'choose-key-type-bip39-address-info': 'Created after xx/xx/2018',

        'sign-tx-heading-tx': 'Confirm Transaction',
        'sign-tx-heading-checkout': 'Verify Payment',
        'sign-tx-includes': 'includes',
        'sign-tx-fee': 'fee',
        'sign-tx-youre-sending': 'You\'re sending',
        'sign-tx-to': 'to',
        'sign-tx-pay-with': 'Pay with',
        'sign-tx-cancel-payment': 'Cancel payment',

        'sign-msg-heading': 'Sign Message',
        'sign-msg-text': 'Please enter your passphrase to sign the following message:',
        'sign-msg-sign-with': 'Sign with',

        'passphrasebox-enter-passphrase': 'Enter your password',
        'passphrasebox-protect-keyfile': 'Protect your keyfile with a password',
        'passphrasebox-repeat-password': 'Repeat your password',
        'passphrasebox-continue': 'Continue',
        'passphrasebox-log-in': 'Unlock',
        'passphrasebox-log-out': 'Confirm logout',
        'passphrasebox-download': 'Download Login File',
        'passphrasebox-confirm-tx': 'Confirm transaction',
        'passphrasebox-sign-msg': 'Sign message',
        'passphrasebox-password-strength-short': 'Enter at least 8 characters',
        'passphrasebox-password-strength-weak': 'That password is too weak',
        'passphrasebox-password-strength-good': 'Ok, that is an average password',
        'passphrasebox-password-strength-strong': 'Great, that is a strong password',
        'passphrasebox-password-strength-secure': 'Super, that is a secure password',
        'passphrasebox-password-hint': 'Your password should have at least 8 characters.',
        'passphrasebox-password-skip': 'Skip for now',

        'identicon-selector-loading': 'Mixing colors',
        'identicon-selector-button-select': 'Select',
        'identicon-selector-link-back': 'Back',
        'identicon-selector-generate-new': 'Generate new',
        'identicon-selector-more-addresses': 'More addresses',

        'download-loginfile-download': 'Download Login File',
        'download-loginfile-tap-and-hold': 'Tap and hold image to download',
        'download-loginfile-continue': 'Continue',

        'validate-words-text': 'Please select the correct word from your list of recovery words.',
        'validate-words-back': 'Back to words',
        'validate-words-skip': 'Skip validation for now',

        'export-file-heading': 'Download Key File',
        'export-button-words': 'Show Recovery Words',
        'export-button-file': 'Download Wallet File',
        'export-finish': 'Finish Export',
        'export-more-options-heading': 'More export options',

        'remove-key-heading': 'Don\'t lose access',
        'remove-key-intro-text': 'If you log out without saving your account, you will irretrievably '
                               + 'lose access to it!',
        'remove-key-login-file': 'Login File',
        'remove-key-login-file-question': 'Is your Login File savely stored and accessible?',
        'remove-key-download-login-file': 'Download Login File',
        'remove-key-recovery-words-question': 'Do you know where your Recovery Words are?',
        'remove-key-show-recovery-words': 'Create a backup',
        'remove-key-first-confirm': 'I am able to log in again',
        'remove-key-enter-label-1': 'Type',
        'remove-key-enter-label-2': 'to log out.',
        'remove-key-final-confirm': 'Log out',
        'remove-key-recovery-words': 'Recovery Words',
        'remove-key-back': 'Back to logout',

        'derive-address-heading-password': 'Unlock your account',
        'derive-address-password-text': 'To add a new address, please[br]unlock your account first.',
        'derive-address-heading-choose-identicon': 'Choose a new address',

        'change-passphrase-heading': 'Change your password',
        'change-paragraph': 'Before entering your new password, you must first unlock your account.',
        'change-set-paragraph': 'Now please enter your new password and repeat it for confirmation.',
    },
    de: {
        _language: 'Deutsch',
        loading: 'Wird geladen...',
        continue: 'Weiter',

        'back-to': 'Zurück zu',

        'passphrase-strength': 'Stärke',
        'passphrase-placeholder': 'Passwort eingeben',
        'passphrase-repeat-placeholder': 'Passwort wiederholen',

        'privacy-warning-heading': 'Wirst du beobachtet?',
        'privacy-warning-text': 'Jetzt ist eine gute Zeit um sich umzuschauen. Gibt es Fenster in der Nähe? '
                              + 'Versteckte Kameras? Jemand der über deine Schulter schaut? '
                              + 'Jeder der deine Wiederherstellungswörter hat, kann auf deine NIM zugreifen '
                              + 'und sie ausgeben.',
        'privacy-agent-continue': 'Weiter',

        'recovery-words-title': 'Wiederherstellungswörter',
        'recovery-words-input-label': 'Wiederherstellungswörter',
        'recovery-words-input-field-placeholder': 'Wort ',
        'recovery-words-explanation': 'Es gibt wirklich keine Passwort-Wiederherstellung. Die folgenden Wörter '
                                    + 'sind ein Backup von deiner Schlüsseldatei und werden dir Zugang zu deiner '
                                    + 'Wallet gewähren, auch wenn deine Schlüsseldatei verloren ist.',
        'recovery-words-storing': 'Schreibe diese Wörter auf ein Stück Papier und verwahre es an einem sicheren, '
                                + 'analogen Ort.',
        'recovery-words-continue-to-words': 'Weiter zu den Wiederherstellungswörtern',

        'create-heading-choose-identicon': 'Wähle deinen Konto-Avatar',
        'create-heading-create-password': 'Erstelle ein Passwort',
        'create-heading-repeat-password': 'Bestätige dein Passwort',
        'create-heading-validate-backup': 'Überprüfe dein Backup',
        'create-wallet-desc': 'Das ist dein Account mit deiner ersten Addresse.',

        'import-heading-enter-recovery-words': 'Wiederherstellungswörter eingeben',
        'import-link-no-wallet': 'Du hast noch keine Wallet?',
        'import-heading-protect': 'Wallet verschlüsseln',
        'import-text-set-password': 'Du kannst jetzt ein Passwort eingeben, um deine Wallet auf diesem '
                                  + 'Gerät zu verschlüsseln.',
        'import-upload-login-file': 'Lade dein Login File hoch',
        'import-unlock-account': 'Entsperre deinen Account',
        'import-create-account': 'Erstelle einen neuen Account',

        'import-file-button-words': 'Wiederherstellungswörter eingeben',

        'import-words-file-available': 'Die Wiederherstellungswörter erzeugen eine neue Login Datei. '
                                     + 'Setze ein Passwort um sie zu schützen.',
        'import-words-file-unavailable': 'Die Wiederherstellungswörter erzeugen einen neuen Account. '
                                       + 'Setze ein Passwort um ihn zu schützen.',
        'import-words-hint': 'Mit Tab kannst du zum nächsten Feld springen',
        'import-words-error': 'Das ist kein gültiger Account. Schreibfehler?',
        'import-words-download-loginfile': 'Lade dein Login File herunter',

        'file-import-prompt': 'Ziehe deine Schlüsseldatei auf dieses Feld',
        'file-import-click-hint': 'Oder klicke um eine Datei auszuwählen.',

        'enter-recovery-words-heading': 'Mit Wiederherstellungswörtern importieren',
        'enter-recovery-words-enter-words': 'Bitte gib deine 24 Wiederherstellungswörter ein.',

        'choose-key-type-heading': 'Schlüsseltyp wählen',
        'choose-key-type-text': 'Wir konnten den Typ deines Schlüssels nicht automatisch ermitteln. '
                              + 'Bitte wähle ihn unten aus.',
        'choose-key-type-or': 'oder',
        'choose-key-type-legacy-address-heading': 'Einzelne Adresse',
        'choose-key-type-legacy-address-info': 'Erstellt vor xx.xx.2018',
        'choose-key-type-bip39-address-heading': 'Mehrere Adressen',
        'choose-key-type-bip39-address-info': 'Erstellt nach xx.xx.2018',

        'sign-tx-heading-tx': 'Überweisung bestätigen',
        'sign-tx-heading-checkout': 'Zahlung bestätigen',
        'sign-tx-includes': 'inklusive',
        'sign-tx-fee': 'Gebühr',
        'sign-tx-youre-sending': 'Du sendest',
        'sign-tx-to': 'an',
        'sign-tx-pay-with': 'Zahle mit',
        'sign-tx-cancel-payment': 'Zahlung abbrechen',

        'sign-msg-heading': 'Nachricht signieren',
        'sign-msg-text': 'Bitte gib deine Passphrase ein, um die folgende Nachricht zu signieren:',
        'sign-msg-sign-with': 'Signieren mit',

        'passphrasebox-enter-passphrase': 'Gib dein Passwort ein',
        'passphrasebox-protect-keyfile': 'Sichere dein KeyFile mit einem Passwort',
        'passphrasebox-repeat-password': 'Wiederhole dein Passwort',
        'passphrasebox-continue': 'Weiter',
        'passphrasebox-log-in': 'Entsperren',
        'passphrasebox-log-out': 'Abmeldung bestätigen',
        'passphrasebox-download': 'Login Datei herunterladen',
        'passphrasebox-confirm-tx': 'Überweisung bestätigen',
        'passphrasebox-sign-msg': 'Nachricht signieren',
        'passphrasebox-password-strength-short': 'Gib mindestens 8 Zeichen ein',
        'passphrasebox-password-strength-weak': 'Dieses Passwort ist zu schwach',
        'passphrasebox-password-strength-good': 'Ok, das ist ein gutes Passwort',
        'passphrasebox-password-strength-strong': 'Gut, das ist ein starkes Passwort',
        'passphrasebox-password-strength-secure': 'Super, das ist ein sicheres Passwort',
        'passphrasebox-password-hint': 'Dein Passwort muss mindestens 8 Zeichen haben.',
        'passphrasebox-password-skip': 'Erstmal überspringen',

        'identicon-selector-loading': 'Mische Farben',
        'identicon-selector-button-select': 'Auswählen',
        'identicon-selector-link-back': 'Zurück',
        'identicon-selector-generate-new': 'Neu generieren',
        'identicon-selector-more-addresses': 'Mehr Adressen',

        'download-loginfile-download': 'Login Datei herunterladen',
        'download-loginfile-tap-and-hold': 'Zum Herunterladen Bild gedrückt halten',
        'download-loginfile-continue': 'Weiter',

        'validate-words-text': 'Bitte wähle das richtige Wort aus deiner Liste von Wiederherstellungswörtern aus.',
        'validate-words-back': 'Zurück zu den Wörtern',
        'validate-words-skip': 'Überprüfung erstmal überspringen',

        'export-file-heading': 'Schlüsseldatei herunterladen',
        'export-button-words': 'Wiederherstellungswörter anzeigen',
        'export-button-file': 'Schlüsseldatei herunterladen',
        'export-finish': 'Export abschließen',
        'export-more-options-heading': 'Zusätzliche Export Optionen',

        'remove-key-heading': 'Verliere deinen Zugang nicht',
        'remove-key-intro-text': 'Falls du dich ausloggst, ohne dein Konto zu sichern, wirst du unwiderruflich'
                               + 'den Zugriff darauf verlieren. ',
        'remove-key-login-file': 'LoginDatei',
        'remove-key-login-file-question': 'Ist deine LoginDatei sicher gespeichert und zugänglich?',
        'remove-key-download-login-file': 'LoginDatei herunterladen',
        'remove-key-recovery-words-question': 'Weißt du, wo sich deine Wiederherstellungswörter befinden?',
        'remove-key-show-recovery-words': 'Sicherung anlegen',
        'remove-key-enter-label-1': 'Gib',
        'remove-key-enter-label-2': 'ein, um dich auszuloggen.',
        'remove-key-final-confirm': 'Ausloggen',
        'remove-key-recovery-words': 'Wiederherstellungswörter',
        'remove-key-back': 'Zurück zum logout',

        'derive-address-heading-password': 'Entschlüssele deinen Account',
        'derive-address-password-text': 'Bitte gib dein Passwort ein um deinem Account eine weitere Adresse '
                                        + 'hinzuzufügen.',
        'derive-address-heading-choose-identicon': 'Wähle deinen Konto-Avatar',
        'derive-address-text-select-avatar': 'Wähle einen Avatar für deinen neuen Account aus der Auswahl unten.',

        'change-passphrase-heading': 'Ändere dein Passwort',
        'change-paragraph': 'Um dein Passwort zu ändern, musst du vorher deinen Account entschlüsseln.',
        'change-set-paragraph': 'Gib jetzt dein neues Passwort ein und wiederhole es danach, um es zu bestätigen.',
    },
};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
