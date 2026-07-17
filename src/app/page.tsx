import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-blue-600 mb-4 tracking-wide">Post-Quantum Cryptography Research</p>
          <h1 className="text-5xl md:text-6xl font-semibold text-neutral-900 mb-8 leading-tight tracking-tight">
            Cryptographic Bounty Board
          </h1>
          <p className="text-xl text-neutral-600 mb-12 leading-relaxed max-w-2xl">
            A platform for researchers to solve cryptographic challenges and earn ARM token rewards. 
            Contribute to post-quantum security research on the Armchain blockchain.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/bounties"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 hover:shadow-lg active:bg-blue-800 active:scale-95 transition-all shadow-sm font-semibold"
            >
              Browse Bounties
            </Link>
            <Link
              href="/bounties/create"
              className="inline-flex items-center justify-center px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 hover:shadow-md hover:border-neutral-400 active:bg-neutral-100 active:scale-95 transition-all font-semibold"
            >
              Create Bounty
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <p className="text-4xl md:text-5xl font-semibold text-neutral-900">50K+</p>
              <p className="text-base text-neutral-600 mt-2 font-medium">ARM in Bounties</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-semibold text-neutral-900">120+</p>
              <p className="text-base text-neutral-600 mt-2 font-medium">Challenges Solved</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-semibold text-neutral-900">85+</p>
              <p className="text-base text-neutral-600 mt-2 font-medium">Researchers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold text-neutral-900 mb-12">Bounty Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'Implementation', key: 'implementation', desc: 'Build PQC algorithms and tools' },
            { name: 'Cryptanalysis', key: 'cryptanalysis', desc: 'Analyze security properties' },
            { name: 'Research', key: 'research', desc: 'Theoretical cryptography' },
            { name: 'Documentation', key: 'documentation', desc: 'Technical writing and guides' },
            { name: 'Security Audit', key: 'audit', desc: 'Review code for vulnerabilities' },
            { name: 'Optimization', key: 'optimization', desc: 'Performance improvements' },
          ].map((category) => (
            <Link
              key={category.key}
              href={`/bounties?category=${category.key}`}
              className="border border-neutral-100 rounded-lg p-6 hover:border-neutral-200 hover:bg-neutral-50 transition-all group"
            >
              <p className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">{category.name}</p>
              <p className="text-sm text-neutral-600 mt-2">{category.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-semibold text-neutral-900 mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-lg font-semibold text-sm mb-4">01</div>
              <h3 className="font-semibold text-neutral-900 mb-3 text-lg">Browse Challenges</h3>
              <p className="text-neutral-600 leading-relaxed">
                Find cryptographic challenges that match your expertise in PQC, cryptanalysis, or implementation.
              </p>
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-lg font-semibold text-sm mb-4">02</div>
              <h3 className="font-semibold text-neutral-900 mb-3 text-lg">Submit Solution</h3>
              <p className="text-neutral-600 leading-relaxed">
                Submit your proof, code, or research paper. All submissions are reviewed by the bounty creator.
              </p>
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-lg font-semibold text-sm mb-4">03</div>
              <h3 className="font-semibold text-neutral-900 mb-3 text-lg">Earn Rewards</h3>
              <p className="text-neutral-600 leading-relaxed">
                Approved solutions receive ARM tokens directly to your wallet. Build your reputation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
