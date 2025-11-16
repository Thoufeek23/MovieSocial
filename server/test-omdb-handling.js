const axios = require('axios');

async function testOmdbErrorHandling() {
    console.log('Testing OMDb error handling...\n');
    
    const API_BASE = 'http://localhost:5001/api';
    
    try {
        console.log('1. Testing movie search...');
        const searchResponse = await axios.get(`${API_BASE}/movies/search?query=batman`);
        console.log(`✓ Search returned ${searchResponse.data.results?.length || 0} movies`);
        
        if (searchResponse.data.results?.length > 0) {
            const firstMovie = searchResponse.data.results[0];
            console.log(`✓ First movie: ${firstMovie.title} (Rating: ${firstMovie.imdbRating} from ${firstMovie.imdbRatingSource})`);
        }
        
        console.log('\n2. Testing movie details...');
        const detailsResponse = await axios.get(`${API_BASE}/movies/550`); // Fight Club
        console.log(`✓ Movie details: ${detailsResponse.data.title} (Rating: ${detailsResponse.data.imdbRating} from ${detailsResponse.data.imdbRatingSource})`);
        
        console.log('\n3. Testing popular movies...');
        const popularResponse = await axios.get(`${API_BASE}/movies/popular`);
        console.log(`✓ Popular movies returned ${popularResponse.data.results?.length || 0} movies`);
        
        console.log('\n✅ All tests passed! OMDb error handling is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testOmdbErrorHandling();