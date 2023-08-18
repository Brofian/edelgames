import {Component} from "react";
import {PlayerScore} from "@edelgames/types/src/modules/darkVoice/dVTypes";
import RoomManager from "../../../framework/util/RoomManager";
import ProfileManager from "../../../framework/util/ProfileManager";
import {UserProfileImage} from "../../../framework/components/ProfileImage/ProfileImage";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

interface IProps {
    scores: PlayerScore[];
    monsterPlayerId: string;
}

export default class DataBoard extends Component<IProps, {}> {

    render() {
        return (
            <div className={'data-board'}>

                <div className={'scoreboard'}>
                    {this.renderPlayerScoreboardHeader()}
                    {this.props.scores.sort((a,b) => b.score-a.score).map(this.renderPlayerScoreboardRow.bind(this))}
                </div>

            </div>
        );
    }

    renderPlayerScoreboardHeader(): JSX.Element {
        return (
            <div className={'scoreboard-row scoreboard-header'}>

                <div className={'scoreboard-col-rank'}>
                    <FontAwesomeIcon  icon={['fad', 'ranking-star']} />
                </div>

                <div className={'scoreboard-col-image'}>
                    <FontAwesomeIcon  icon={['fad', 'user']} />
                </div>

                <div className={'scoreboard-col-name'}>
                </div>

                <div className={'scoreboard-col-points'}>
                    <FontAwesomeIcon  icon={['fad', 'scythe']} />
                </div>

            </div>
        );
    }

    renderPlayerScoreboardRow(score: PlayerScore, index: number): JSX.Element {
        const player = RoomManager.getRoomMembers().find(member => member.getId() === score.playerId);
        const localePlayerId = ProfileManager.getId();

        if(!player) {
            return <></>;
        }

        const isLocalePlayer = localePlayerId === player.getId();
        const isMonsterPlayer = this.props.monsterPlayerId === player.getId();

        const rowClasses = ['scoreboard-row'];
        if(isLocalePlayer) rowClasses.push('is-locale-player');
        if(isMonsterPlayer) rowClasses.push('is-monster-player');

        return (
            <div className={rowClasses.join(' ')}>

                <div className={'scoreboard-col-rank'}>
                    {index + 1}
                </div>

                <div className={'scoreboard-col-image'}>
                    <UserProfileImage user={player} />
                </div>

                <div className={'scoreboard-col-name'}>
                    <span>
                        {player.getUsername()}
                    </span>

                    <span>
                        { isMonsterPlayer && <FontAwesomeIcon  icon={['fad', 'alien']} />}
                    </span>
                </div>

                <div className={'scoreboard-col-points'}>
                    {score.score}
                </div>

            </div>
        );
    }

}