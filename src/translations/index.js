const TRANSLATIONS = {
    en: {
        _language: 'English',
        loading: 'Loading...',
        'passphrase-strength': 'Strength',
        'passphrase-confirm': 'Confirm',
        'passphrase-placeholder': 'Enter Passphrase',
        'sign-tx-header': 'Authorize Transaction',
        'sign-tx-byline': 'Please confirm the following transaction:',
        'sign-tx-byline-passphrase': 'Enter your passphrase below to authorize this transaction:',
        'sign-tx-error-wrong-passphrase': 'Wrong Passphrase, please try again',
        'sign-tx-button-enter-pin': 'Enter PIN',
        'create-choose-identicon-header1': 'Choose Your Account Avatar',
        'create-set-passphrase-header1': 'Set a Passphrase',
        'create-set-passphrase-header2': 'Please enter a Passphrase to secure your account.',
        'create-set-passphrase-warning': `The Passphrase is [strong]not[/strong] an alternative for your 24 Recovery
            Words!`,
        'recovery-words-title': 'Recovery Words',
        'tx-from': 'From',
        'tx-to': 'To',
        'tx-message': 'Message',
        'tx-fee': 'Fee',
    },
    de: {
        _language: 'Deutsch',
        loading: 'Wird geladen...',
        'passphrase-strength': 'Stärke',
        'passphrase-confirm': 'Bestätigen',
        'passphrase-placeholder': 'Passphrase eingeben',
        'sign-tx-header': 'Überweisung Authorisieren',
        'sign-tx-byline': 'Bitte bestätige die folgende Überweisung:',
        'sign-tx-byline-passphrase': 'Bitte geb deine Passphrase ein, um die Überweisung zu bestätigen:',
        'sign-tx-error-wrong-passphrase': 'Falsche Passphrase, bitte versuche es nochmal',
        'sign-tx-button-enter-pin': 'PIN eingeben',
        'create-choose-identicon-header1': 'Wähle einen Avatar für dein Konto',
        'create-set-passphrase-header1': 'Lege eine Passphrase fest',
        'create-set-passphrase-header2': 'Bitte gib eine Passphrase ein, um dein Konto zu sichern.',
        'create-set-passphrase-warning': `Die Passphrase ist [strong]keine[/strong] Alternative für deine 24
            Wiederherstellungswörter!`,
        'recovery-words-title': 'Wiederherstellungswörter',
        'tx-from': 'Von',
        'tx-to': 'An',
        'tx-message': 'Nachricht',
        'tx-fee': 'Gebühr',
    },
};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
