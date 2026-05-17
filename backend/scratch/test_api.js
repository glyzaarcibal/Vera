
import axios from 'axios';

async function testResources() {
    try {
        const res = await axios.get('https://vera-44mw.onrender.com/api/resources');
        console.log('Resources fetch success:', res.data.resources?.length, 'items');
    } catch (e) {
        console.error('Resources fetch failed:', e.message);
    }
}

testResources();
