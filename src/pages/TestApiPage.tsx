import React, { useState } from 'react';
import { authApi, docsApi } from '../services/api';

export const TestApiPage: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testAuthApi = async () => {
    setIsLoading(true);
    setTestResult('');

    try {
      console.log('Testing auth API...');
      
      // Test registration
      const testUser = {
        first_name: 'Test',
        last_name: 'User',
        username: `test_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'testpassword123'
      };

      console.log('Test user data:', testUser);
      
      await authApi.register(testUser);
      setTestResult('✅ Registration test successful!\n\nNow testing login...');
      
      // Test login with the same user
      setTimeout(async () => {
        try {
          const loginResult = await authApi.login({
            username: testUser.username,
            password: testUser.password
          });
          
          setTestResult(prev => prev + `\n✅ Login test successful!\n\nLogin response: ${JSON.stringify(loginResult, null, 2)}`);
          
          // Test getCurrentUser
          setTimeout(async () => {
            try {
              const userInfo = await authApi.getCurrentUser();
              setTestResult(prev => prev + `\n✅ GetCurrentUser test successful!\n\nUser info: ${JSON.stringify(userInfo, null, 2)}`);
            } catch (error: any) {
              setTestResult(prev => prev + `\n❌ GetCurrentUser test failed: ${error.message}`);
            }
          }, 1000);
          
        } catch (error: any) {
          setTestResult(prev => prev + `\n❌ Login test failed: ${error.message}`);
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('Test failed:', error);
      setTestResult(`❌ Test failed: ${error.message}\n\nDetails: ${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLoginOnly = async () => {
    setIsLoading(true);
    setTestResult('');

    try {
      console.log('Testing login only...');
      
      const loginResult = await authApi.login({
        username: 'rurick', // Use existing user
        password: 'password123'
      });
      
      setTestResult(`✅ Login test successful!\n\nLogin response: ${JSON.stringify(loginResult, null, 2)}`);
      
      // Test getCurrentUser
      setTimeout(async () => {
        try {
          const userInfo = await authApi.getCurrentUser();
          setTestResult(prev => prev + `\n✅ GetCurrentUser test successful!\n\nUser info: ${JSON.stringify(userInfo, null, 2)}`);
        } catch (error: any) {
          setTestResult(prev => prev + `\n❌ GetCurrentUser test failed: ${error.message}`);
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('Login test failed:', error);
      setTestResult(`❌ Login test failed: ${error.message}\n\nDetails: ${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDocumentsApi = async () => {
    setIsLoading(true);
    setTestResult('');

    try {
      console.log('Testing documents API...');
      
      // Test getDocuments
      const documentsResponse = await docsApi.getDocuments();
      setTestResult(`✅ GetDocuments test successful!\n\nResponse: ${JSON.stringify(documentsResponse, null, 2)}`);
      
      // Test getDocumentsByOwner if we have user info
      setTimeout(async () => {
        try {
          const userInfo = await authApi.getCurrentUser();
          const documentsByOwnerResponse = await docsApi.getDocumentsByOwner(userInfo.id);
          setTestResult(prev => prev + `\n✅ GetDocumentsByOwner test successful!\n\nResponse: ${JSON.stringify(documentsByOwnerResponse, null, 2)}`);
        } catch (error: any) {
          setTestResult(prev => prev + `\n❌ GetDocumentsByOwner test failed: ${error.message}`);
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('Documents API test failed:', error);
      setTestResult(`❌ Documents API test failed: ${error.message}\n\nDetails: ${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testUploadDocument = async () => {
    setIsLoading(true);
    setTestResult('');

    try {
      console.log('Testing document upload...');
      
      // Create a test file
      const testContent = 'This is a test document content for upload testing.';
      const testFile = new File([testContent], 'test-document.txt', { type: 'text/plain' });
      
      // Get current user for owner_id
      const userInfo = await authApi.getCurrentUser();
      
      const uploadResponse = await docsApi.uploadDocument(testFile, userInfo.id);
      setTestResult(`✅ Upload document test successful!\n\nResponse: ${JSON.stringify(uploadResponse, null, 2)}`);
      
      // Test task status if we have task_id
      if (uploadResponse.task_id) {
        setTimeout(async () => {
          try {
            const taskStatus = await docsApi.getTaskStatus(uploadResponse.task_id);
            setTestResult(prev => prev + `\n✅ Task status test successful!\n\nResponse: ${JSON.stringify(taskStatus, null, 2)}`);
          } catch (error: any) {
            setTestResult(prev => prev + `\n❌ Task status test failed: ${error.message}`);
          }
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('Upload test failed:', error);
      setTestResult(`❌ Upload test failed: ${error.message}\n\nDetails: ${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={testAuthApi}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Full Auth Flow'}
          </button>
          
          <button
            onClick={testLoginOnly}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Login Only'}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={testDocumentsApi}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Documents API'}
          </button>
          
          <button
            onClick={testUploadDocument}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Upload Document'}
          </button>
        </div>
        
        {testResult && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Test Result:</h3>
            <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
      </div>
    </div>
  );
}; 