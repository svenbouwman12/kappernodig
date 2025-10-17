import PostcodeLookup from '../components/PostcodeLookup'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nederlandse Adres Opzoeker
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Zoek het juiste adres op basis van postcode en huisnummer via de officiële PostcodeAPI.nu
          </p>
        </div>
        
        <PostcodeLookup />
        
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              💡 Test instructies
            </h3>
            <div className="text-blue-800 space-y-2">
              <p>• Klik op de <strong>"Test"</strong> knop om automatisch testdata in te vullen</p>
              <p>• Of vul handmatig in: <strong>postcode "9711AC"</strong> en <strong>huisnummer "10"</strong></p>
              <p>• Het systeem gebruikt de officiële PostcodeAPI.nu voor 100% accurate Nederlandse adressen</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
