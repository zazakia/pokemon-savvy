"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Pokemon data
const POKEMON_DATA = {
  pikachu: { name: "Pikachu", type: "Electric", baseHp: 35, baseAttack: 55, sprite: "⚡" },
  charmander: { name: "Charmander", type: "Fire", baseHp: 39, baseAttack: 52, sprite: "🔥" },
  squirtle: { name: "Squirtle", type: "Water", baseHp: 44, baseAttack: 48, sprite: "💧" },
  bulbasaur: { name: "Bulbasaur", type: "Grass", baseHp: 45, baseAttack: 49, sprite: "🌱" },
  rattata: { name: "Rattata", type: "Normal", baseHp: 30, baseAttack: 56, sprite: "🐭" },
  pidgey: { name: "Pidgey", type: "Flying", baseHp: 40, baseAttack: 45, sprite: "🐦" },
}

// Shop items
const SHOP_ITEMS = {
  pokeball: { name: "Pokeball", price: 200, description: "Catch wild Pokemon", sprite: "⚪" },
  potion: { name: "Potion", price: 300, description: "Restore 20 HP to a Pokemon", sprite: "🧪" },
}

type PokemonType = keyof typeof POKEMON_DATA
type GameState = "overworld" | "battle" | "menu" | "shop"

interface Pokemon {
  id: string
  name: string
  type: string
  level: number
  hp: number
  maxHp: number
  attack: number
  sprite: string
}

interface Player {
  x: number
  y: number
  pokemon: Pokemon[]
  pokeballs: number
  potions: number
  money: number
  activePokemonIndex: number
}

const createPokemon = (type: PokemonType, level = 5): Pokemon => {
  const data = POKEMON_DATA[type]
  const maxHp = Math.floor(data.baseHp + level * 2)
  const attack = Math.floor(data.baseAttack + level * 1.5)

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: data.name,
    type: data.type,
    level,
    hp: maxHp,
    maxHp,
    attack,
    sprite: data.sprite,
  }
}

const getRandomPokemon = (): Pokemon => {
  const types = Object.keys(POKEMON_DATA) as PokemonType[]
  const randomType = types[Math.floor(Math.random() * types.length)]
  const level = Math.floor(Math.random() * 3) + 3 // Level 3-5
  return createPokemon(randomType, level)
}

export default function PokemonGame() {
  const [gameState, setGameState] = useState<GameState>("overworld")
  const [player, setPlayer] = useState<Player>({
    x: 5,
    y: 5,
    pokemon: [createPokemon("pikachu", 5)],
    pokeballs: 5,
    potions: 2,
    money: 1000,
    activePokemonIndex: 0,
  })
  const [wildPokemon, setWildPokemon] = useState<Pokemon | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [playerTurn, setPlayerTurn] = useState(true)

  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      if (gameState !== "overworld") return

      setPlayer((prev) => {
        const newX = Math.max(0, Math.min(9, prev.x + dx))
        const newY = Math.max(0, Math.min(9, prev.y + dy))

        // Random encounter chance (20%)
        if (Math.random() < 0.2 && (newX !== prev.x || newY !== prev.y)) {
          const wild = getRandomPokemon()
          setWildPokemon(wild)
          setGameState("battle")
          setBattleLog([`A wild ${wild.name} appeared!`])
          setPlayerTurn(true)
        }

        return { ...prev, x: newX, y: newY }
      })
    },
    [gameState],
  )

  const attack = () => {
    if (!wildPokemon || !playerTurn || player.pokemon.length === 0) return

    const activePokemon = player.pokemon[player.activePokemonIndex]
    if (!activePokemon || activePokemon.hp <= 0) return

    const damage = Math.floor(Math.random() * activePokemon.attack) + 10

    setWildPokemon((prev) => {
      if (!prev) return null
      const newHp = Math.max(0, prev.hp - damage)

      setBattleLog((prev) => [...prev, `${activePokemon.name} dealt ${damage} damage!`])

      if (newHp === 0) {
        const moneyReward = Math.floor(Math.random() * 100) + 50 // 50-150 money
        setBattleLog((prev) => [...prev, `Wild ${wildPokemon.name} fainted!`, `You earned $${moneyReward}!`])
        setPlayer((prev) => ({ ...prev, money: prev.money + moneyReward }))
        setTimeout(() => {
          setGameState("overworld")
          setWildPokemon(null)
          setBattleLog([])
        }, 3000)
        return { ...prev, hp: newHp }
      }

      setPlayerTurn(false)
      return { ...prev, hp: newHp }
    })
  }

  const throwPokeball = () => {
    if (!wildPokemon || !playerTurn || player.pokeballs <= 0) return

    setPlayer((prev) => ({ ...prev, pokeballs: prev.pokeballs - 1 }))

    // Catch rate based on wild Pokemon's remaining HP
    const catchRate = 1 - wildPokemon.hp / wildPokemon.maxHp
    const caught = Math.random() < catchRate * 0.7 + 0.3 // 30-100% based on HP

    setBattleLog((prev) => [...prev, `You threw a Pokeball!`])

    setTimeout(() => {
      if (caught) {
        const moneyReward = Math.floor(Math.random() * 50) + 25 // 25-75 money for catching
        setBattleLog((prev) => [...prev, `${wildPokemon.name} was caught!`, `You earned $${moneyReward}!`])
        setPlayer((prev) => ({
          ...prev,
          pokemon: [...prev.pokemon, { ...wildPokemon, hp: wildPokemon.maxHp }],
          money: prev.money + moneyReward,
        }))
        setTimeout(() => {
          setGameState("overworld")
          setWildPokemon(null)
          setBattleLog([])
        }, 3000)
      } else {
        setBattleLog((prev) => [...prev, `${wildPokemon.name} broke free!`])
        setPlayerTurn(false)
      }
    }, 1000)
  }

  const run = () => {
    setBattleLog((prev) => [...prev, "You ran away safely!"])
    setTimeout(() => {
      setGameState("overworld")
      setWildPokemon(null)
      setBattleLog([])
    }, 1000)
  }

  const switchActivePokemon = (index: number) => {
    if (player.pokemon[index] && player.pokemon[index].hp > 0) {
      setPlayer((prev) => ({ ...prev, activePokemonIndex: index }))
    }
  }

  const buyItem = (item: keyof typeof SHOP_ITEMS) => {
    const itemData = SHOP_ITEMS[item]
    if (player.money < itemData.price) return

    setPlayer((prev) => {
      const newPlayer = { ...prev, money: prev.money - itemData.price }
      if (item === "pokeball") {
        newPlayer.pokeballs += 1
      } else if (item === "potion") {
        newPlayer.potions += 1
      }
      return newPlayer
    })
  }

  // Movement and encounter system
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
          movePlayer(0, -1)
          break
        case "ArrowDown":
        case "s":
          movePlayer(0, 1)
          break
        case "ArrowLeft":
        case "a":
          movePlayer(-1, 0)
          break
        case "ArrowRight":
        case "d":
          movePlayer(1, 0)
          break
        case "Escape":
          if (gameState === "shop") {
            setGameState("overworld")
          } else {
            setGameState(gameState === "menu" ? "overworld" : "menu")
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [movePlayer, gameState])

  // Wild Pokemon turn
  useEffect(() => {
    if (!playerTurn && wildPokemon && wildPokemon.hp > 0 && player.pokemon.length > 0) {
      setTimeout(() => {
        const activePokemon = player.pokemon[player.activePokemonIndex]
        if (!activePokemon || activePokemon.hp <= 0) return

        const damage = Math.floor(Math.random() * wildPokemon.attack) + 5

        setPlayer((prev) => {
          const newPokemon = [...prev.pokemon]
          newPokemon[prev.activePokemonIndex] = {
            ...newPokemon[prev.activePokemonIndex],
            hp: Math.max(0, newPokemon[prev.activePokemonIndex].hp - damage),
          }
          return { ...prev, pokemon: newPokemon }
        })

        setBattleLog((prev) => [...prev, `Wild ${wildPokemon.name} dealt ${damage} damage!`])

        if (activePokemon.hp - damage <= 0) {
          setBattleLog((prev) => [...prev, `${activePokemon.name} fainted!`])

          // Check if there are other Pokemon available
          const availablePokemon = player.pokemon.filter((p, i) => i !== player.activePokemonIndex && p.hp > 0)
          if (availablePokemon.length === 0) {
            setBattleLog((prev) => [...prev, "All your Pokemon have fainted! You ran away!"])
            setTimeout(() => {
              setGameState("overworld")
              setWildPokemon(null)
              setBattleLog([])
            }, 2000)
          } else {
            // Auto-switch to first available Pokemon
            const newActiveIndex = player.pokemon.findIndex((p, i) => i !== player.activePokemonIndex && p.hp > 0)
            setPlayer((prev) => ({ ...prev, activePokemonIndex: newActiveIndex }))
            setBattleLog((prev) => [...prev, `Go ${player.pokemon[newActiveIndex].name}!`])
            setPlayerTurn(true)
          }
        } else {
          setPlayerTurn(true)
        }
      }, 1500)
    }
  }, [playerTurn, wildPokemon, player.pokemon, player.activePokemonIndex])

  // Render overworld
  const renderOverworld = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Pokemon World</h2>
        <p className="text-sm text-muted-foreground mb-4">Use WASD or arrow keys to move. Press ESC for menu.</p>
      </div>

      <div className="grid grid-cols-10 gap-1 max-w-md mx-auto">
        {Array.from({ length: 100 }, (_, i) => {
          const x = i % 10
          const y = Math.floor(i / 10)
          const isPlayer = x === player.x && y === player.y
          const isGrass = Math.random() > 0.7
          const isShop = x === 0 && y === 0

          return (
            <div
              key={i}
              className={`w-8 h-8 border flex items-center justify-center text-lg ${
                isPlayer
                  ? "bg-blue-500 text-white"
                  : isShop
                    ? "bg-purple-300"
                    : isGrass
                      ? "bg-green-200"
                      : "bg-gray-100"
              }`}
            >
              {isPlayer ? "🧑" : isShop ? "🏪" : isGrass ? "🌿" : ""}
            </div>
          )
        })}
      </div>

      <div className="text-center space-y-2">
        <div className="flex justify-center space-x-4">
          <span>💰 ${player.money}</span>
          <span>⚪ {player.pokeballs}</span>
          <span>🧪 {player.potions}</span>
          <span>📱 {player.pokemon.length}</span>
        </div>
        <Button onClick={() => setGameState("shop")} variant="outline" className="mt-2">
          Visit Shop 🏪
        </Button>
      </div>
    </div>
  )

  // Render battle
  const renderBattle = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Battle!</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Wild Pokemon */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Wild {wildPokemon?.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <div className="text-6xl">{wildPokemon?.sprite}</div>
            <Badge variant="secondary">{wildPokemon?.type}</Badge>
            <p>Level {wildPokemon?.level}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>HP</span>
                <span>
                  {wildPokemon?.hp}/{wildPokemon?.maxHp}
                </span>
              </div>
              <Progress value={wildPokemon ? (wildPokemon.hp / wildPokemon.maxHp) * 100 : 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Player Pokemon */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              {player.pokemon[player.activePokemonIndex]?.name}
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <div className="text-6xl">{player.pokemon[player.activePokemonIndex]?.sprite}</div>
            <Badge variant="secondary">{player.pokemon[player.activePokemonIndex]?.type}</Badge>
            <p>Level {player.pokemon[player.activePokemonIndex]?.level}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>HP</span>
                <span>
                  {player.pokemon[player.activePokemonIndex]?.hp}/{player.pokemon[player.activePokemonIndex]?.maxHp}
                </span>
              </div>
              <Progress
                value={
                  player.pokemon[player.activePokemonIndex]
                    ? (player.pokemon[player.activePokemonIndex].hp / player.pokemon[player.activePokemonIndex].maxHp) *
                      100
                    : 0
                }
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Battle Log */}
      <Card>
        <CardContent className="p-4">
          <div className="h-24 overflow-y-auto space-y-1">
            {battleLog.map((log, i) => (
              <p key={i} className="text-sm">
                {log}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Battle Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={attack}
          disabled={
            !playerTurn ||
            !wildPokemon ||
            wildPokemon.hp <= 0 ||
            !player.pokemon[player.activePokemonIndex] ||
            player.pokemon[player.activePokemonIndex].hp <= 0
          }
          className="h-12"
        >
          Attack
        </Button>
        <Button
          onClick={throwPokeball}
          disabled={!playerTurn || player.pokeballs <= 0}
          variant="secondary"
          className="h-12"
        >
          Pokeball ({player.pokeballs})
        </Button>
        <Button onClick={run} disabled={!playerTurn} variant="outline" className="h-12 col-span-2 bg-transparent">
          Run Away
        </Button>
      </div>
    </div>
  )

  // Render menu
  const renderMenu = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Pokemon Inventory</h2>
        <p className="text-sm text-muted-foreground">Click on a Pokemon to make it active for battles</p>
      </div>

      <div className="grid gap-3">
        {player.pokemon.map((pokemon, i) => (
          <Card
            key={pokemon.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              i === player.activePokemonIndex
                ? "ring-2 ring-blue-500 bg-blue-50"
                : pokemon.hp <= 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50"
            }`}
            onClick={() => pokemon.hp > 0 && switchActivePokemon(i)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{pokemon.sprite}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-lg">{pokemon.name}</h3>
                    <Badge variant="secondary">{pokemon.type}</Badge>
                    {i === player.activePokemonIndex && (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                    {pokemon.hp <= 0 && (
                      <Badge variant="destructive" className="text-xs">
                        Fainted
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                    <span>Level {pokemon.level}</span>
                    <span>Attack: {pokemon.attack}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>HP</span>
                      <span className={pokemon.hp <= 0 ? "text-red-500" : ""}>
                        {pokemon.hp}/{pokemon.maxHp}
                      </span>
                    </div>
                    <Progress
                      value={(pokemon.hp / pokemon.maxHp) * 100}
                      className={`h-2 ${pokemon.hp <= 0 ? "opacity-50" : ""}`}
                    />
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => usePotion(i)}
                    disabled={player.potions <= 0 || pokemon.hp >= pokemon.maxHp}
                    className="text-xs"
                  >
                    🧪 Heal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Money</p>
            <p className="text-xl font-bold">${player.money}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pokeballs</p>
            <p className="text-xl font-bold">{player.pokeballs}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Potions</p>
            <p className="text-xl font-bold">{player.potions}</p>
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <Button onClick={() => setGameState("overworld")} className="w-full">
          Back to World
        </Button>
        <p className="text-xs text-muted-foreground">
          Use potions to heal Pokemon. Healthy Pokemon can be selected as active.
        </p>
      </div>
    </div>
  )

  // Render shop
  const renderShop = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🏪 Pokemon Shop</h2>
        <p className="text-sm text-muted-foreground">Buy items to help on your adventure!</p>
        <div className="mt-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            💰 ${player.money}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {Object.entries(SHOP_ITEMS).map(([key, item]) => (
          <Card key={key} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{item.sprite}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-sm">
                      ${item.price}
                    </Badge>
                    <Button
                      onClick={() => buyItem(key as keyof typeof SHOP_ITEMS)}
                      disabled={player.money < item.price}
                      size="sm"
                    >
                      Buy
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Your Inventory</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Pokeballs</p>
            <p className="text-xl font-bold">⚪ {player.pokeballs}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Potions</p>
            <p className="text-xl font-bold">🧪 {player.potions}</p>
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <Button onClick={() => setGameState("overworld")} className="w-full">
          Back to World
        </Button>
        <p className="text-xs text-muted-foreground">Earn money by winning battles and catching Pokemon!</p>
      </div>
    </div>
  )

  const usePotion = (pokemonIndex: number) => {
    if (player.potions <= 0 || player.pokemon[pokemonIndex].hp >= player.pokemon[pokemonIndex].maxHp) return

    setPlayer((prev) => {
      const newPokemon = [...prev.pokemon]
      const healAmount = Math.min(20, newPokemon[pokemonIndex].maxHp - newPokemon[pokemonIndex].hp)
      newPokemon[pokemonIndex] = {
        ...newPokemon[pokemonIndex],
        hp: Math.min(newPokemon[pokemonIndex].maxHp, newPokemon[pokemonIndex].hp + 20),
      }
      return {
        ...prev,
        pokemon: newPokemon,
        potions: prev.potions - 1,
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-green-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-blue-800 mb-2">Pokemon Adventure</h1>
          <p className="text-gray-600">Catch 'em all in this retro-style Pokemon game!</p>
        </div>

        <Card className="min-h-[600px]">
          <CardContent className="p-6">
            {gameState === "overworld" && renderOverworld()}
            {gameState === "battle" && renderBattle()}
            {gameState === "menu" && renderMenu()}
            {gameState === "shop" && renderShop()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
