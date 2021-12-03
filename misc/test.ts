
//test typescript code locally
//npx ts-node test.ts
const subnets = [
    {
        ipv4CidrBlock: '10.0.0.0/24',
        name: 'private1'
    },
    {
        ipv4CidrBlock: '10.0.1.0/24',
        name: 'private2'
    },
    {
        ipv4CidrBlock: '10.0.2.0/24',
        name: 'private3'
    },
]


subnets.forEach( (value) => {
    console.log(value.ipv4CidrBlock)
})