import { publish } from 'gh-pages';

publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/ohchad/rrapp.git', // Update to point to your repository
        user: {
            name: 'chad steele', // update to use your name
            email: 'chad.steele@obviohealth.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)